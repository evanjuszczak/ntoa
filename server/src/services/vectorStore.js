import { LLMService } from './llm.service.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const llm = new LLMService();

export const setupVectorStore = async () => {
  try {
    console.log('Setting up vector store...');
    
    // First check if we can connect to Supabase
    const { data: testData, error: testError } = await supabase
      .from('documents')
      .select('count(*)')
      .limit(1)
      .single();

    if (testError) {
      console.error('Vector store setup error:', {
        error: testError,
        message: testError.message,
        hint: testError.hint,
        details: testError.details,
        code: testError.code
      });

      // Check if the error is because the table doesn't exist
      if (testError.code === '42P01') {
        console.log('Documents table not found, attempting to create...');
        
        // Try to enable vector extension
        const { error: vectorError } = await supabase.rpc('extensions', {
          name: 'vector'
        });
        
        if (vectorError) {
          console.error('Failed to enable vector extension:', {
            error: vectorError,
            message: vectorError.message,
            hint: vectorError.hint,
            details: vectorError.details,
            code: vectorError.code
          });
          throw new Error('Vector extension not available. Please enable it in your Supabase project.');
        }

        // Run initialization SQL directly
        const { error: initError } = await supabase.rpc('sql', {
          query: `
            -- Create the documents table if it doesn't exist
            create table if not exists documents (
              id bigserial primary key,
              content text not null,
              embedding vector(1536),
              metadata jsonb default '{}'::jsonb,
              created_at timestamp with time zone default timezone('utc'::text, now()) not null
            );

            -- Create a function to calculate cosine similarity
            create or replace function cosine_similarity(a vector, b vector)
            returns float
            language plpgsql
            as $$
            begin
              return (a <#> b) * -1;
            end;
            $$;

            -- Create a function to match documents by embedding similarity
            create or replace function match_documents(
              query_embedding vector(1536),
              match_threshold float default 0.5,
              match_count int default 5
            )
            returns table (
              id bigint,
              content text,
              metadata jsonb,
              similarity float
            )
            language plpgsql
            as $$
            begin
              return query
              select
                documents.id,
                documents.content,
                documents.metadata,
                cosine_similarity(documents.embedding, query_embedding) as similarity
              from documents
              where cosine_similarity(documents.embedding, query_embedding) > match_threshold
              order by cosine_similarity(documents.embedding, query_embedding) desc
              limit match_count;
            end;
            $$;
          `
        });

        if (initError) {
          console.error('Failed to initialize vector store:', {
            error: initError,
            message: initError.message,
            hint: initError.hint,
            details: initError.details,
            code: initError.code
          });
          throw new Error('Failed to create necessary database objects.');
        }
      } else {
        throw new Error(`Database connection error: ${testError.message}`);
      }
    }

    // Verify the setup by checking if we can insert and query vectors
    console.log('Verifying vector store setup...');
    const testEmbedding = await llm.embeddings('test');
    
    if (!testEmbedding || !Array.isArray(testEmbedding) || testEmbedding.length !== 1536) {
      console.error('Invalid embedding generated:', {
        embedding: testEmbedding ? `${testEmbedding.length} dimensions` : 'null',
        isArray: Array.isArray(testEmbedding)
      });
      throw new Error('Failed to generate valid embeddings. Check OpenAI API configuration.');
    }

    console.log('Test embedding generated successfully');

    const { error: insertError } = await supabase
      .from('documents')
      .insert([{
        content: 'test',
        embedding: testEmbedding,
        metadata: { test: true }
      }]);

    if (insertError) {
      console.error('Vector store verification failed:', {
        error: insertError,
        message: insertError.message,
        hint: insertError.hint,
        details: insertError.details,
        code: insertError.code
      });
      throw new Error('Failed to verify vector store setup.');
    }

    console.log('Test document inserted successfully');

    // Clean up test data
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('content', 'test');

    if (deleteError) {
      console.warn('Failed to clean up test data:', {
        error: deleteError,
        message: deleteError.message
      });
    } else {
      console.log('Test data cleaned up successfully');
    }

    console.log('Vector store setup complete and verified');
    return true;
  } catch (error) {
    console.error('Vector store setup failed:', {
      error: error,
      message: error.message,
      stack: error.stack,
      supabaseUrl: process.env.SUPABASE_URL ? 'configured' : 'missing',
      supabaseKey: process.env.SUPABASE_SERVICE_KEY ? 'configured' : 'missing',
      openaiKey: process.env.OPENAI_API_KEY ? 'configured' : 'missing'
    });
    throw error;
  }
};

export const addDocumentToStore = async (text, metadata = {}) => {
  try {
    const embedding = await llm.embeddings(text);
    
    if (!Array.isArray(embedding)) {
      throw new Error('Invalid embedding format. Expected array of numbers');
    }

    const { data, error } = await supabase
      .from('documents')
      .insert([
        {
          content: text,
          embedding,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
          }
        }
      ])
      .select();

    if (error) {
      throw error;
    }

    return {
      id: data[0].id,
      text,
      metadata
    };
  } catch (error) {
    console.error('Error adding document to store:', error);
    throw error;
  }
};

export const searchSimilarDocuments = async (query, k = 5) => {
  try {
    const queryEmbedding = await llm.embeddings(query);

    const { data: documents, error } = await supabase
      .rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: k
      });

    if (error) {
      throw error;
    }

    return documents.map(doc => ({
      pageContent: doc.content,
      metadata: doc.metadata,
      similarity: doc.similarity
    }));
  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
};

export const deleteAllDocuments = async () => {
  try {
    const { error } = await supabase
      .from('documents')
      .delete()
      .neq('id', 0); // Delete all documents

    if (error) {
      throw error;
    }

    console.log('All documents deleted successfully');
  } catch (error) {
    console.error('Error deleting documents:', error);
    throw error;
  }
};

export const getDocumentCount = async () => {
  try {
    const { count, error } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    return count;
  } catch (error) {
    console.error('Error getting document count:', error);
    throw error;
  }
};

export const clearAllDocuments = async () => {
  try {
    console.log('Starting document cleanup...');
    
    // First get the count
    const { count, error: countError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error getting document count:', {
        error: countError.message,
        code: countError.code,
        hint: countError.hint
      });
      throw countError;
    }

    console.log(`Found ${count} documents to delete`);

    // Delete all documents
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .neq('id', 0); // Delete all documents

    if (deleteError) {
      console.error('Error deleting documents:', {
        error: deleteError.message,
        code: deleteError.code,
        hint: deleteError.hint
      });
      throw deleteError;
    }

    // Verify deletion
    const { count: remainingCount, error: verifyError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });

    if (verifyError) {
      console.error('Error verifying deletion:', {
        error: verifyError.message,
        code: verifyError.code,
        hint: verifyError.hint
      });
      throw verifyError;
    }

    console.log('Document cleanup complete:', {
      deletedCount: count,
      remainingCount: remainingCount || 0
    });

    return {
      success: true,
      deletedCount: count,
      remainingCount: remainingCount || 0
    };
  } catch (error) {
    console.error('Document cleanup failed:', {
      error: error.message,
      code: error.code,
      hint: error.hint,
      stack: error.stack
    });
    throw error;
  }
}; 
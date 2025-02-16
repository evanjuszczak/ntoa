import { LLMService } from './llm.service.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const llm = new LLMService();

export const setupVectorStore = async () => {
  try {
    console.log('Setting up vector store...');
    
    // First check if we can connect to Supabase
    const { data: testData, error: testError } = await supabase
      .from('documents')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('Vector store setup error:', {
        error: testError,
        message: testError.message,
        hint: testError.hint,
        details: testError.details,
        code: testError.code
      });

      // If table doesn't exist, create it
      if (testError.code === '42P01') {
        console.log('Creating documents table and functions...');
        
        // Create table and functions
        const { error: setupError } = await supabase.rpc('setup_vector_store', {});
        
        if (setupError) {
          console.error('Failed to setup vector store:', setupError);
          throw new Error('Failed to setup vector store: ' + setupError.message);
        }
      } else {
        throw new Error(`Database connection error: ${testError.message}`);
      }
    }

    // Test the setup with a sample embedding
    console.log('Testing vector store setup...');
    const testEmbedding = await llm.embeddings('test');
    
    if (!testEmbedding || !Array.isArray(testEmbedding) || testEmbedding.length !== 1536) {
      throw new Error('Failed to generate valid embeddings');
    }

    // Try inserting a test document
    const { error: insertError } = await supabase
      .from('documents')
      .insert({
        content: 'test document',
        embedding: testEmbedding,
        metadata: { test: true }
      });

    if (insertError) {
      throw new Error('Failed to insert test document: ' + insertError.message);
    }

    // Clean up test document
    await supabase
      .from('documents')
      .delete()
      .eq('content', 'test document');

    console.log('Vector store setup completed successfully');
    return true;
  } catch (error) {
    console.error('Vector store setup failed:', error);
    throw error;
  }
};

export const addDocumentToStore = async (text, metadata = {}) => {
  try {
    const embedding = await llm.embeddings(text);
    
    const { data, error } = await supabase
      .from('documents')
      .insert({
        content: text,
        embedding,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) throw error;
    return { id: data.id, text, metadata };
  } catch (error) {
    console.error('Error adding document:', error);
    throw error;
  }
};

export const searchSimilarDocuments = async (query, limit = 5) => {
  try {
    const embedding = await llm.embeddings(query);
    
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_count: limit
    });

    if (error) throw error;
    return data;
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
      .neq('id', 0);

    if (error) throw error;
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
    await deleteAllDocuments();
    return { success: true };
  } catch (error) {
    console.error('Failed to clear documents:', error);
    throw error;
  }
}; 
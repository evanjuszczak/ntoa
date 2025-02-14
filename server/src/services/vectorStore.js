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
    // Check if the documents table exists by trying to get a single row
    const { data, error } = await supabase
      .from('documents')
      .select('id')
      .limit(1);

    if (error && error.code !== 'PGRST116') { // PGRST116 means relation doesn't exist
      console.error('Error checking documents table:', error);
      throw error;
    }

    console.log('Vector store is ready');
    return true;
  } catch (error) {
    console.error('Error connecting to vector store:', error);
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
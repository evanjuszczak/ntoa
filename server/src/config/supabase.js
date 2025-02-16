import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseServiceKey,
    env: process.env.NODE_ENV
  });
  throw new Error('Supabase configuration is required. Please check your environment variables.');
}

// Validate URL format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.error('Invalid Supabase URL format:', {
    url: supabaseUrl,
    isHttps: supabaseUrl.startsWith('https://'),
    hasSupabaseDomain: supabaseUrl.includes('.supabase.co')
  });
  throw new Error('Invalid Supabase URL format');
}

// Create Supabase admin client with service key
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'X-Client-Info': 'server'
    }
  }
});

// Test the connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Supabase connection test failed:', {
        error: error,
        message: error.message,
        status: error.status,
        details: error.details
      });
      throw error;
    }
    console.log('Supabase connection test successful');
  } catch (error) {
    console.error('Failed to test Supabase connection:', {
      error: error,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Run the connection test
testConnection().catch(error => {
  console.error('Initial Supabase connection test failed:', error);
}); 
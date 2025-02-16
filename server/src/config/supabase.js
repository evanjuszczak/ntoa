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
  throw new Error('Supabase configuration is required');
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
  }
});

// Test the connection and verify service role
const testConnection = async () => {
  try {
    // First test basic connection
    const { data: testData, error: testError } = await supabase
      .from('documents')
      .select('count(*)')
      .limit(1)
      .single();

    if (testError && testError.code !== '42P01') { // Ignore table not found error
      console.error('Supabase connection test failed:', {
        error: testError.message,
        code: testError.code,
        hint: testError.hint
      });
      throw testError;
    }

    // Test auth with service role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Service role authentication failed:', {
        error: authError.message,
        code: authError.code,
        status: authError.status
      });
      throw authError;
    }

    console.log('Supabase connection and auth test successful:', {
      serviceRole: true,
      url: supabaseUrl ? 'configured' : 'missing',
      key: supabaseServiceKey ? 'configured' : 'missing'
    });

    return true;
  } catch (error) {
    console.error('Failed to test Supabase connection:', {
      error: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
};

// Run the connection test
testConnection().catch(error => {
  console.error('Initial Supabase connection test failed:', {
    message: error.message,
    code: error.code,
    hint: error.hint
  });
}); 
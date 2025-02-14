import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug log for environment variables
console.log('Supabase Configuration:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length,
  env: import.meta.env.MODE,
  envVars: Object.keys(import.meta.env).filter(key => key.includes('SUPABASE'))
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    env: import.meta.env.MODE,
    envVars: Object.keys(import.meta.env)
  });
  throw new Error('Supabase configuration is required. Please check your environment variables.');
}

// Validate URL format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.error('Invalid Supabase URL format:', supabaseUrl);
  throw new Error('Invalid Supabase URL format');
}

// Validate anon key format
if (!supabaseAnonKey.includes('.') || supabaseAnonKey.split('.').length !== 3) {
  console.error('Invalid Supabase anon key format');
  throw new Error('Invalid Supabase anon key format');
}

export const STORAGE_BUCKET = 'notes';

// Create Supabase client with retries
const createClientWithRetry = (retries = 3) => {
  let attempt = 0;
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      storage: window.localStorage,
      storageKey: 'supabase.auth.token',
      debug: true
    }
  });

  // Test the client
  const testClient = async () => {
    try {
      const { error } = await client.auth.getSession();
      if (error) throw error;
      console.log('Supabase client initialized successfully');
      return client;
    } catch (error) {
      console.error(`Supabase client test failed (attempt ${attempt + 1}):`, error);
      if (attempt < retries) {
        attempt++;
        console.log(`Retrying Supabase client initialization (${attempt}/${retries})...`);
        return testClient();
      }
      throw error;
    }
  };

  return testClient();
};

// Initialize client
export const supabase = await createClientWithRetry();

// Initialize storage bucket if it doesn't exist
export const initializeStorage = async () => {
  try {
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      throw bucketsError;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_BUCKET);

    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: false,
        fileSizeLimit: 52428800, // 50MB in bytes
        allowedMimeTypes: ['application/pdf']
      });
      
      if (error) {
        console.error('Error creating bucket:', error);
        throw error;
      }
      
      console.log('Storage bucket created successfully');
    } else {
      console.log('Storage bucket already exists');
    }
  } catch (error) {
    console.error('Storage initialization error:', error);
    throw new Error('Failed to initialize storage: ' + error.message);
  }
}; 
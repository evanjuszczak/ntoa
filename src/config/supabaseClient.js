import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase configuration is required. Please check your environment variables.');
}

// Validate URL format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  throw new Error('Invalid Supabase URL format');
}

// Validate anon key format
if (!supabaseAnonKey.includes('.') || supabaseAnonKey.split('.').length !== 3) {
  throw new Error('Invalid Supabase anon key format');
}

export const STORAGE_BUCKET = 'notes';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  logger: {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {}
  }
});

// Initialize storage bucket if it doesn't exist
export const initializeStorage = async () => {
  try {
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) throw bucketsError;

    const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_BUCKET);

    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: false,
        fileSizeLimit: 52428800, // 50MB in bytes
        allowedMimeTypes: ['application/pdf']
      });
      
      if (error) throw error;
    }
  } catch (error) {
    throw new Error('Failed to initialize storage: ' + error.message);
  }
}; 
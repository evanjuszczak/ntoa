import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug log for environment variables
console.log('Supabase Configuration:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length,
  env: import.meta.env.MODE,
  envVars: Object.keys(import.meta.env).filter(key => key.includes('SUPABASE')),
  fullUrl: supabaseUrl,
  keyPrefix: supabaseAnonKey?.substring(0, 10) + '...'
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
  console.error('Invalid Supabase URL format:', {
    url: supabaseUrl,
    isHttps: supabaseUrl.startsWith('https://'),
    hasSupabaseDomain: supabaseUrl.includes('.supabase.co')
  });
  throw new Error('Invalid Supabase URL format');
}

// Validate anon key format
if (!supabaseAnonKey.includes('.') || supabaseAnonKey.split('.').length !== 3) {
  console.error('Invalid Supabase anon key format:', {
    hasDelimiter: supabaseAnonKey.includes('.'),
    parts: supabaseAnonKey.split('.').length,
    keyStart: supabaseAnonKey.substring(0, 10) + '...'
  });
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
    warn: console.warn,
    error: console.error
  }
});

// Test the client connection and setup refresh handler
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth state change:', {
    event,
    hasSession: !!session,
    userEmail: session?.user?.email,
    timestamp: new Date().toISOString(),
    sessionExpiry: session?.expires_at,
    accessToken: session?.access_token ? 'present' : 'missing'
  });

  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully');
  }

  if (event === 'SIGNED_IN') {
    console.log('User signed in, navigating to dashboard');
  }

  if (event === 'SIGNED_OUT') {
    console.log('User signed out, clearing session');
    await supabase.auth.signOut();
    window.location.href = '/';
  }
});

// Initialize storage bucket if it doesn't exist
export const initializeStorage = async () => {
  try {
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error('Error listing buckets:', {
        error: bucketsError,
        message: bucketsError.message,
        details: bucketsError.details
      });
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
        console.error('Error creating bucket:', {
          error: error,
          message: error.message,
          details: error.details
        });
        throw error;
      }
      
      console.log('Storage bucket created successfully');
    } else {
      console.log('Storage bucket already exists');
    }
  } catch (error) {
    console.error('Storage initialization error:', {
      error: error,
      message: error.message,
      stack: error.stack
    });
    throw new Error('Failed to initialize storage: ' + error.message);
  }
}; 
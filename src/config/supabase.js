import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create a custom bucket for notes
export const STORAGE_BUCKET = 'notes';

// Initialize the storage bucket
(async () => {
  const { data, error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
    public: false,
    allowedMimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
      'application/vnd.ms-powerpoint' // PPT
    ],
    fileSizeLimit: 524288000 // 500MB in bytes
  });
  
  if (error && !error.message.includes('already exists')) {
    console.error('Error creating bucket:', error);
  }
})(); 
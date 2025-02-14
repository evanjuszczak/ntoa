import { supabase } from '../config/supabaseClient';
import { STORAGE_BUCKET, initializeStorage } from '../config/supabaseClient';

// Use the same bucket name consistently
const BUCKET_NAME = STORAGE_BUCKET;

// Add debug logging utility at the top
const debug = (...args) => {
  if (process.env.NODE_ENV === 'development' && import.meta.env.VITE_DEBUG_LOGS === 'true') {
    console.log(...args);
  }
};

// Helper function to ensure user is authenticated with Supabase
const ensureAuth = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    throw new Error('Authentication required');
  }
  return session;
};

// Helper to sanitize file names
const sanitizeFileName = (fileName) => {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
};

export const uploadFile = async (file, path = '') => {
  try {
    const session = await ensureAuth();
    const userFolder = `users/${session.user.id}`;
    const sanitizedFileName = sanitizeFileName(file.name);
    const uniqueFileName = `${Date.now()}_${sanitizedFileName}`;
    const filePath = `${userFolder}/${uniqueFileName}`;

    debug('Uploading:', sanitizedFileName);

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(error.message || 'Failed to upload file');
    }
    
    debug('Upload complete:', sanitizedFileName);

    return {
      path: filePath,
      name: sanitizedFileName,
      metadata: {
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      },
      created_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

export const deleteFile = async (path) => {
  try {
    const session = await ensureAuth();
    const fullPath = path.includes(`users/${session.user.id}`) ? path : `users/${session.user.id}/${path}`;
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fullPath]);

    if (error) throw error;
    
    debug('File deleted:', path);
    return true;
  } catch (error) {
    throw error;
  }
};

export const getFileUrl = async (path) => {
  try {
    const session = await ensureAuth();
    const fullPath = path.includes(`users/${session.user.id}`) ? path : `users/${session.user.id}/${path}`;

    const { data: fileData, error: fileError } = await supabase.storage
      .from(BUCKET_NAME)
      .list(fullPath.split('/').slice(0, -1).join('/'));

    if (fileError) throw fileError;

    const fileName = fullPath.split('/').pop();
    const fileExists = fileData.some(file => file.name === fileName);

    if (!fileExists) {
      throw new Error(`File not found: ${fullPath}`);
    }

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(fullPath, 3600);
    
    if (error) throw error;

    if (!data?.signedUrl) {
      throw new Error('No signed URL returned from Supabase');
    }
    
    return data.signedUrl;
  } catch (error) {
    throw error;
  }
};

export const listFiles = async (path = '') => {
  try {
    const session = await ensureAuth();
    const userFolder = `users/${session.user.id}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(userFolder, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) throw error;

    if (!data) return [];

    const filteredData = data
      .filter(file => file.name !== '.emptyFolderPlaceholder')
      .map(file => ({
        ...file,
        path: `${userFolder}/${file.name}`,
        name: file.name.substring(file.name.indexOf('_') + 1)
      }));

    debug('Files found:', filteredData.length);
    return filteredData;
  } catch (error) {
    throw error;
  }
}; 
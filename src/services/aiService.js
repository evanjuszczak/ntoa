import { supabase } from '../config/supabaseClient';

const API_BASE_URL = import.meta.env.VITE_AI_API_ENDPOINT.endsWith('/api') 
  ? import.meta.env.VITE_AI_API_ENDPOINT
  : `${import.meta.env.VITE_AI_API_ENDPOINT}/api`;

export const processFiles = async (fileUrls) => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error('Failed to get session');
    if (!session?.access_token) throw new Error('No authentication token available');

    const response = await fetch(`${API_BASE_URL}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ files: fileUrls })
    });

    if (!response.ok) {
      const text = await response.text();
      let errorMessage;
      try {
        const errorData = JSON.parse(text);
        errorMessage = errorData.message || errorData.error || 'Request failed';
      } catch {
        errorMessage = text || `Request failed with status ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Process error:', error.message);
    throw error;
  }
};

export const askQuestion = async (question, internetSearch = false) => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;

    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        question,
        internetSearch,
        useOnlyUploadedDocs: !internetSearch,
        chatHistory: []
      }),
      credentials: 'include'
    });

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401) {
        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) throw new Error('Authentication failed. Please log in again.');
        
        // Retry the request with new token
        if (refreshData.session) {
          const retryResponse = await fetch(`${API_BASE_URL}/ask`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${refreshData.session.access_token}`
            },
            body: JSON.stringify({
              question,
              internetSearch,
              useOnlyUploadedDocs: !internetSearch,
              chatHistory: []
            }),
            credentials: 'include'
          });
          
          if (!retryResponse.ok) {
            throw new Error('Failed to process question after token refresh');
          }
          
          return await retryResponse.json();
        }
      }
      
      throw new Error(responseData?.message || 'Failed to get response from AI');
    }

    if (!internetSearch && (!responseData?.sources || responseData.sources.length === 0)) {
      throw new Error('No relevant information found in your uploaded documents. Try enabling web search or upload more relevant documents.');
    }

    return responseData;
  } catch (error) {
    console.error('Error asking question:', error);
    throw error;
  }
};

export const getFileContent = async (fileUrl) => {
  try {
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;

    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(fileUrl, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) throw new Error('Authentication failed. Please log in again.');
        
        // Retry the request with new token
        if (refreshData.session) {
          const retryResponse = await fetch(fileUrl, {
            headers: {
              'Authorization': `Bearer ${refreshData.session.access_token}`
            },
            credentials: 'include'
          });
          
          if (!retryResponse.ok) {
            throw new Error('Failed to fetch file content after token refresh');
          }
          
          return await retryResponse.blob();
        }
      }
      throw new Error('Failed to fetch file content');
    }
    
    return await response.blob();
  } catch (error) {
    console.error('Error fetching file content:', error);
    throw error;
  }
};

export const cleanupDocuments = async () => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Session error:', {
        message: sessionError.message,
        code: sessionError.code,
        status: sessionError.status,
        name: sessionError.name
      });
      throw sessionError;
    }

    if (!session?.access_token) {
      console.error('No access token available');
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error('Cleanup request failed:', {
        status: response.status,
        statusText: response.statusText,
        response: responseText,
        headers: Object.fromEntries(response.headers),
        url: response.url
      });

      if (response.status === 401) {
        console.log('Attempting token refresh...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) throw new Error('Authentication failed. Please log in again.');
        
        if (refreshData?.session) {
          const retryResponse = await fetch(`${API_BASE_URL}/api/cleanup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${refreshData.session.access_token}`
            },
            credentials: 'include'
          });
          
          if (!retryResponse.ok) {
            throw new Error('Failed to cleanup after token refresh');
          }
          
          return await retryResponse.json();
        }
      }
      
      throw new Error(`Cleanup failed: ${responseText}`);
    }

    const result = await response.json();
    console.log('Cleanup successful:', result);
    return result;
  } catch (error) {
    console.error('Cleanup error:', {
      message: error.message,
      cause: error.cause,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
}; 
import { supabase } from '../config/supabaseClient';

const API_BASE_URL = 'https://ntoa.vercel.app';

export const processFiles = async (fileUrls) => {
  try {
    console.log('Processing files:', fileUrls);
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Session error:', {
        error: sessionError,
        message: sessionError.message,
        status: sessionError.status,
        details: sessionError.details
      });
      throw sessionError;
    }

    if (!session?.access_token) {
      console.error('No access token in session:', {
        hasSession: !!session,
        sessionExpiry: session?.expires_at,
        user: session?.user?.email
      });
      throw new Error('No authentication token available');
    }
    
    console.log('Making API request with token:', {
      tokenPrefix: session.access_token.substring(0, 10) + '...',
      expires: session.expires_at,
      user: session.user.email
    });
    
    const response = await fetch(`${API_BASE_URL}/api/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ files: fileUrls }),
      credentials: 'include'
    });

    const responseData = await response.json().catch((error) => {
      console.error('Error parsing response:', error);
      return null;
    });
    
    console.log('Response details:', {
      status: response.status,
      statusText: response.statusText,
      data: responseData,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.log('Attempting token refresh...');
        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('Session refresh failed:', {
            error: refreshError,
            message: refreshError.message,
            status: refreshError.status,
            details: refreshError.details
          });
          throw new Error('Authentication failed. Please log in again.');
        }
        
        // Retry the request with new token
        if (refreshData?.session) {
          console.log('Retrying with refreshed token:', {
            tokenPrefix: refreshData.session.access_token.substring(0, 10) + '...',
            expires: refreshData.session.expires_at
          });
          
          const retryResponse = await fetch(`${API_BASE_URL}/api/process`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${refreshData.session.access_token}`
            },
            body: JSON.stringify({ files: fileUrls }),
            credentials: 'include'
          });
          
          if (!retryResponse.ok) {
            console.error('Retry failed:', {
              status: retryResponse.status,
              statusText: retryResponse.statusText,
              headers: Object.fromEntries(retryResponse.headers.entries())
            });
            throw new Error('Failed to process files after token refresh');
          }
          
          const retryData = await retryResponse.json();
          console.log('Retry successful:', retryData);
          return retryData;
        }
      }
      
      const errorMessage = responseData?.error?.message || responseData?.message || response.statusText;
      throw new Error(`Server error (${response.status}): ${errorMessage}`);
    }

    return responseData;
  } catch (error) {
    console.error('Error processing files:', {
      error: error,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

export const askQuestion = async (question, internetSearch = false) => {
  try {
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;

    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/ask`, {
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
          const retryResponse = await fetch(`${API_BASE_URL}/api/ask`, {
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
import { supabase } from '../config/supabaseClient';

export const processFiles = async (fileUrls) => {
  try {
    console.log('Processing files:', fileUrls);
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;

    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }
    
    const response = await fetch('/api/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ files: fileUrls })
    });

    const responseData = await response.json().catch(() => null);
    
    console.log('Response details:', {
      status: response.status,
      statusText: response.statusText,
      data: responseData
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) throw new Error('Authentication failed. Please log in again.');
        
        // Retry the request with new token
        if (refreshData.session) {
          const retryResponse = await fetch('/api/process', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${refreshData.session.access_token}`
            },
            body: JSON.stringify({ files: fileUrls })
          });
          
          if (!retryResponse.ok) {
            throw new Error('Failed to process files after token refresh');
          }
          
          return await retryResponse.json();
        }
      }
      
      const errorMessage = responseData?.error?.message || responseData?.message || response.statusText;
      throw new Error(`Server error (${response.status}): ${errorMessage}`);
    }

    return responseData;
  } catch (error) {
    console.error('Error processing files:', error);
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

    const response = await fetch('/api/ask', {
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
      })
    });

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401) {
        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) throw new Error('Authentication failed. Please log in again.');
        
        // Retry the request with new token
        if (refreshData.session) {
          const retryResponse = await fetch('/api/ask', {
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
            })
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
      }
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
            }
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
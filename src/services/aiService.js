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

    console.log('Response details:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorData.message || response.statusText;
      } catch (e) {
        errorMessage = await response.text();
      }
      
      console.error('Server error:', {
        status: response.status,
        statusText: response.statusText,
        message: errorMessage
      });
      
      throw new Error(`Server error (${response.status}): ${errorMessage}`);
    }

    return await response.json();
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to get response from AI');
    }

    const data = await response.json();
    
    if (!internetSearch && (!data.sources || data.sources.length === 0)) {
      throw new Error('No relevant information found in your uploaded documents. Try enabling web search or upload more relevant documents.');
    }

    return data;
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
      throw new Error('Failed to fetch file content');
    }
    return await response.blob();
  } catch (error) {
    console.error('Error fetching file content:', error);
    throw error;
  }
}; 
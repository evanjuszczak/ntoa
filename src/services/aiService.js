import { supabase } from '../config/supabaseClient';

const AI_ENDPOINT = import.meta.env.VITE_AI_API_ENDPOINT || 'http://localhost:3000/api';

export const processFiles = async (fileUrls) => {
  try {
    console.log('Processing files:', fileUrls);
    console.log('Using API endpoint:', AI_ENDPOINT);
    
    const response = await fetch(`${AI_ENDPOINT}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ files: fileUrls }),
      mode: 'cors',
      credentials: 'include'
    });

    console.log('Response details:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      url: response.url,
      origin: window.location.origin
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
    console.error('Error processing files:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      endpoint: AI_ENDPOINT
    });
    throw error;
  }
};

export const askQuestion = async (question, internetSearch = false) => {
  try {
    console.log('Asking question with settings:', {
      question,
      internetSearch,
      endpoint: `${AI_ENDPOINT}/ask`
    });

    const response = await fetch(`${AI_ENDPOINT}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        question,
        internetSearch,
        useOnlyUploadedDocs: !internetSearch,
        chatHistory: []
      }),
      mode: 'cors',
      credentials: 'include'
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
    const response = await fetch(fileUrl, {
      mode: 'cors',
      credentials: 'include'
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
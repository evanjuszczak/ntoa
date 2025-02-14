import { supabase } from '../config/supabaseClient';

export const saveConversation = async (title, messages) => {
  try {
    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Format messages to ensure consistent structure
    const formattedMessages = messages.map(msg => ({
      text: msg.text || msg.content || '',
      sender: msg.sender || msg.role || 'user',
      sources: msg.sources || []
    }));

    console.log('Attempting to save conversation:', {
      user_id: user.id,
      title,
      messageCount: formattedMessages.length
    });

    const { data, error } = await supabase
      .from('saved_notes')
      .insert([
        {
          user_id: user.id,
          title,
          conversation: formattedMessages,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw new Error(`Failed to save: ${error.message}`);
    }
    
    console.log('Successfully saved conversation:', data);
    return data;
  } catch (error) {
    console.error('Error saving conversation:', {
      error: error.message,
      stack: error.stack
    });
    throw new Error(`Failed to save conversation: ${error.message}`);
  }
};

export const getSavedConversations = async () => {
  try {
    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('Fetching conversations for user:', user.id);

    const { data, error } = await supabase
      .from('saved_notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw new Error(`Failed to fetch: ${error.message}`);
    }

    console.log('Successfully fetched conversations:', {
      count: data?.length || 0,
      conversations: data
    });

    if (!data || data.length === 0) {
      console.log('No conversations found for user');
      return [];
    }

    // Validate and format the conversation data structure
    const validatedData = data.map(note => ({
      ...note,
      conversation: (note.conversation || []).map(msg => ({
        text: msg.text || msg.content || '',
        sender: msg.sender || msg.role || 'user',
        sources: msg.sources || []
      }))
    }));

    return validatedData;
  } catch (error) {
    console.error('Error getting saved conversations:', {
      error: error.message,
      stack: error.stack
    });
    throw new Error(`Failed to get conversations: ${error.message}`);
  }
};

export const deleteSavedConversation = async (id) => {
  try {
    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('Attempting to delete conversation:', { id, user_id: user.id });

    const { error } = await supabase
      .from('saved_notes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Supabase delete error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw new Error(`Failed to delete: ${error.message}`);
    }

    console.log('Successfully deleted conversation:', id);
    return true;
  } catch (error) {
    console.error('Error deleting conversation:', {
      error: error.message,
      stack: error.stack
    });
    throw new Error(`Failed to delete conversation: ${error.message}`);
  }
}; 
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class LLMService {
  async embeddings(text) {
    try {
      console.log('Generating embeddings for text length:', text.length);
      
      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
        encoding_format: "float",
      });

      if (!response.data?.[0]?.embedding) {
        throw new Error('Invalid response from OpenAI embeddings API');
      }

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embeddings:', {
        error: error.message,
        status: error.status,
        type: error.type,
        code: error.code
      });
      throw error;
    }
  }

  async chat(messages) {
    try {
      console.log('Sending chat request with messages:', messages.length);
      
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: 0.3,
        max_tokens: 500,
        presence_penalty: 0,
        frequency_penalty: 0,
      });

      if (!response.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from OpenAI chat API');
      }

      return {
        content: response.choices[0].message.content
      };
    } catch (error) {
      console.error('Error in chat:', {
        error: error.message,
        status: error.status,
        type: error.type,
        code: error.code
      });
      throw error;
    }
  }
} 
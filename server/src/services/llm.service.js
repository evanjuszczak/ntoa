import { Configuration, OpenAIApi } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export class LLMService {
  async embeddings(text) {
    try {
      const response = await openai.createEmbedding({
        model: "text-embedding-ada-002",
        input: text,
      });

      return response.data.data[0].embedding;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }
  }

  async chat(messages) {
    try {
      const response = await openai.createChatCompletion({
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

      return {
        content: response.data.choices[0].message.content
      };
    } catch (error) {
      console.error('Error in chat:', error);
      throw error;
    }
  }
} 
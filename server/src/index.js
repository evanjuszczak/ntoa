import app from './server.js';
import dotenv from 'dotenv';
import { setupVectorStore } from './services/vectorStore.js';

// Load environment variables
dotenv.config();

const port = process.env.PORT || 3000;

// Initialize vector store
setupVectorStore().catch(error => {
  console.error('Failed to setup vector store:', error);
  process.exit(1);
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Environment:', process.env.NODE_ENV);
}); 
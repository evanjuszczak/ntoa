import app from './server.js';
import dotenv from 'dotenv';
import { setupVectorStore } from './services/vectorStore.js';
import { createServer } from 'http';

// Load environment variables
dotenv.config();

const startServer = async (initialPort) => {
  let port = initialPort;
  const maxAttempts = 10;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const server = createServer(app);
      
      await new Promise((resolve, reject) => {
        server.on('error', (error) => {
          if (error.code === 'EADDRINUSE') {
            console.log(`Port ${port} is in use, trying ${port + 1}...`);
            server.close();
            port++;
          } else {
            reject(error);
          }
        });

        server.on('listening', () => {
          console.log(`Server running on port ${port}`);
          console.log('Environment:', process.env.NODE_ENV);
          resolve();
        });

        server.listen(port);
      });

      return server;
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        throw new Error(`Could not find an available port after ${maxAttempts} attempts`);
      }
    }
  }
};

// Initialize vector store and start server
const init = async () => {
  try {
    await setupVectorStore();
    await startServer(process.env.PORT || 3000);
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
};

init(); 
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import aiRoutes from './routes/ai.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setupVectorStore } from './services/vectorStore.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize express app
const app = express();
const port = process.env.PORT || 3000;

// Initialize vector store
let vectorStoreInitialized = false;

const initVectorStore = async () => {
  try {
    await setupVectorStore();
    vectorStoreInitialized = true;
    console.log('Vector store initialized successfully');
  } catch (error) {
    console.error('Failed to initialize vector store:', error);
    throw error;
  }
};

// CORS configuration
const corsOptions = {
  origin: 'https://ntoa.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 204
};

// Middleware
app.use(cors(corsOptions));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log('Incoming request:', {
    method: req.method,
    path: req.path,
    origin: req.headers.origin,
    headers: req.headers
  });
  next();
});

// Handle preflight requests
app.options('*', (req, res) => {
  console.log('Handling preflight request:', {
    origin: req.headers.origin,
    method: req.method,
    headers: req.headers
  });
  
  // Set CORS headers explicitly
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  res.status(204).end();
});

// Additional security headers
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    vectorStore: vectorStoreInitialized ? 'initialized' : 'not initialized'
  });
});

// Check vector store initialization before processing requests
app.use('/api/*', async (req, res, next) => {
  if (!vectorStoreInitialized) {
    try {
      await initVectorStore();
      next();
    } catch (error) {
      res.status(500).json({
        error: 'Server Configuration Error',
        message: 'Failed to initialize vector store'
      });
    }
  } else {
    next();
  }
});

// Routes
app.use('/api', aiRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  console.log('Allowed origins:', corsOptions.origin);
  try {
    await initVectorStore();
  } catch (error) {
    console.error('Server started but vector store initialization failed:', error);
  }
}); 
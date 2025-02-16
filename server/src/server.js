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

// Validate required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'OPENAI_API_KEY',
  'NODE_ENV'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  console.log('Available environment variables:', Object.keys(process.env));
  process.exit(1);
}

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
    console.error('Failed to initialize vector store:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
};

// CORS configuration
const ALLOWED_ORIGINS = ['https://ntoa.vercel.app', 'http://localhost:3000', 'http://localhost:5173'];

const corsOptions = {
  origin: function (origin, callback) {
    console.log('Incoming request origin:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.error('Origin not allowed:', {
        origin,
        allowedOrigins: ALLOWED_ORIGINS
      });
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Debug middleware
app.use((req, res, next) => {
  console.log('Request:', {
    method: req.method,
    path: req.path,
    origin: req.headers.origin,
    auth: req.headers.authorization ? 'present' : 'missing',
    headers: req.headers
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    vectorStore: vectorStoreInitialized ? 'initialized' : 'not initialized',
    env: process.env.NODE_ENV,
    supabase: {
      url: process.env.SUPABASE_URL ? 'configured' : 'missing',
      key: process.env.SUPABASE_SERVICE_KEY ? 'configured' : 'missing'
    },
    openai: {
      key: process.env.OPENAI_API_KEY ? 'configured' : 'missing'
    },
    server: {
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid
    }
  });
});

// Initialize vector store before handling API requests
app.use('/api/*', async (req, res, next) => {
  if (!vectorStoreInitialized) {
    try {
      await initVectorStore();
      next();
    } catch (error) {
      console.error('Vector store initialization failed:', {
        error: error.message,
        stack: error.stack,
        name: error.name
      });
      res.status(500).json({
        error: 'Server Configuration Error',
        message: 'Failed to initialize vector store',
        details: error.message
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
const server = app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Configuration:', {
    supabaseUrl: process.env.SUPABASE_URL ? 'configured' : 'missing',
    supabaseKey: process.env.SUPABASE_SERVICE_KEY ? 'configured' : 'missing',
    openaiKey: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
    allowedOrigins: ALLOWED_ORIGINS
  });
  
  try {
    await initVectorStore();
  } catch (error) {
    console.error('Server started but vector store initialization failed:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
  }
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Export for Vercel
export default app; 
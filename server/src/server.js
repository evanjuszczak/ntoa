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

// Initialize express app
const app = express();

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
    auth: req.headers.authorization ? 'present' : 'missing'
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const envVars = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NODE_ENV: process.env.NODE_ENV
  };

  const missingVars = Object.entries(envVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  res.json({ 
    status: 'ok',
    environment: process.env.NODE_ENV,
    missingEnvVars: missingVars,
    server: {
      version: process.version,
      platform: process.platform
    }
  });
});

// Routes
app.use('/api', aiRoutes);

// Error handling
app.use(errorHandler);

// Export for Vercel
export default app; 
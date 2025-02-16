import express from 'express';
import cors from 'cors';
import aiRoutes from './routes/ai.routes.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// Configure CORS
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  maxAge: 86400
};

app.use(cors(corsOptions));

// Increase payload limit for file processing
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

// Mount AI routes
app.use('/api', aiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    supabaseConfigured: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_KEY,
    openaiConfigured: !!process.env.OPENAI_API_KEY
  });
});

// Handle root path
app.get('/', (req, res) => {
  res.json({ 
    message: 'Note AI API is running',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Handle specific error types
  if (err.name === 'UnauthorizedError' || err.status === 401) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: err.message,
      hint: 'Please check your authentication token'
    });
  }

  if (err.name === 'ValidationError' || err.status === 400) {
    return res.status(400).json({
      error: 'Bad Request',
      message: err.message,
      hint: 'Please check your request parameters'
    });
  }

  res.status(err.status || 500).json({
    error: err.name || 'Server Error',
    message: err.message || 'An unexpected error occurred',
    hint: err.hint || 'Please try again later'
  });
});

const port = process.env.PORT || 3000;

// Only start server if not running in Vercel
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

export default app; 
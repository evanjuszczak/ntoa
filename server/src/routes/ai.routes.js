import express from 'express';
import { processDocument, handleQuestion } from '../services/ai.service.js';
import { supabase } from '../config/supabase.js';
import { createClient } from '@supabase/supabase-js';
import { clearAllDocuments } from '../services/vectorStore.js';

const router = express.Router();

// Middleware to verify authentication
const verifyAuth = async (req, res, next) => {
  try {
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const authHeader = req.headers.authorization;
    console.log('Auth request:', {
      path: req.path,
      method: req.method,
      origin: req.headers.origin,
      hasAuth: !!authHeader,
      headers: req.headers
    });

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Invalid auth header:', {
        header: authHeader,
        type: typeof authHeader
      });
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or missing authorization header',
        hint: 'Ensure Bearer token is provided'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token received:', {
      length: token.length,
      prefix: token.substring(0, 20) + '...'
    });

    // Create a fresh Supabase client for each request
    const auth = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    );

    try {
      const { data: { user }, error } = await auth.auth.getUser(token);

      if (error) {
        console.error('Auth error:', {
          message: error.message,
          status: error.status,
          name: error.name,
          stack: error.stack
        });
        return res.status(401).json({
          error: 'Unauthorized',
          message: error.message,
          hint: 'Token validation failed'
        });
      }

      if (!user) {
        console.error('No user found for token');
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not found',
          hint: 'Token may be invalid or expired'
        });
      }

      console.log('Auth successful:', {
        userId: user.id,
        email: user.email,
        role: user.role
      });

      // Store user info in request
      req.user = user;
      next();
    } catch (error) {
      console.error('Auth verification failed:', {
        error: error.message,
        name: error.name,
        stack: error.stack
      });
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authentication token',
        hint: error.message
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', {
      error: error.message,
      name: error.name,
      stack: error.stack
    });
    return res.status(500).json({
      error: 'Server Error',
      message: 'Authentication check failed',
      hint: error.message
    });
  }
};

// Apply authentication middleware to all routes
router.use(verifyAuth);

// Process uploaded files
router.post('/process', async (req, res, next) => {
  try {
    const { files } = req.body;
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No files provided'
      });
    }

    // Clear existing documents before processing new ones
    await clearAllDocuments();

    // Process files sequentially to avoid conflicts
    const results = [];
    for (const fileUrl of files) {
      const fileName = fileUrl.split('/').pop();
      const result = await processDocument(fileUrl, fileName);
      results.push(result);
    }

    res.json({
      success: true,
      message: 'Files processed successfully',
      results
    });
  } catch (error) {
    console.error('Process error:', error);
    
    // Check for specific error types
    if (error.message.includes('infinite loop')) {
      return res.status(508).json({
        error: 'Processing Error',
        message: 'Request processing exceeded limits',
        hint: 'Try processing fewer files at once'
      });
    }
    
    next(error);
  }
});

// Handle chat messages
router.post('/ask', async (req, res, next) => {
  try {
    const { question, chatHistory } = req.body;
    if (!question) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No question provided'
      });
    }

    const response = await handleQuestion(question, chatHistory);
    res.json(response);
  } catch (error) {
    console.error('Ask error:', error);
    next(error);
  }
});

// Add cleanup endpoint
router.post('/cleanup', async (req, res, next) => {
  try {
    console.log('Cleanup requested by:', {
      userId: req.user.id,
      email: req.user.email
    });

    const result = await clearAllDocuments();
    
    res.json({
      success: true,
      message: 'Cleanup completed successfully',
      ...result
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    next(error);
  }
});

export default router; 
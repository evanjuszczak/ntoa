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

    // Skip auth in development
    if (process.env.NODE_ENV === 'development') {
      req.user = { id: 'dev-user', email: 'dev@example.com' };
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or missing authorization header'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: error?.message || 'Invalid token'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authentication token'
      });
    }
  } catch (error) {
    next(error);
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
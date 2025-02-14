import express from 'express';
import { processDocument, handleQuestion } from '../services/ai.service.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Middleware to verify authentication
const verifyAuth = async (req, res, next) => {
  try {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authorization header'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
      // Verify the JWT token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid token'
        });
      }

      if (!user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not found'
        });
      }

      // Add user data to request
      req.user = user;
      next();
    } catch (verifyError) {
      console.error('Token verification error:', verifyError);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token format'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Authentication check failed'
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

    const results = await Promise.all(
      files.map(async (fileUrl) => {
        const fileName = fileUrl.split('/').pop();
        return processDocument(fileUrl, fileName);
      })
    );

    res.json({
      success: true,
      message: 'Files processed successfully',
      results
    });
  } catch (error) {
    console.error('Process error:', error);
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

export default router; 
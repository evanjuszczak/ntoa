import express from 'express';
import { processDocument, handleQuestion } from '../services/ai.service.js';
import { supabase } from '../config/supabase.js';
import { createClient } from '@supabase/supabase-js';
import { clearAllDocuments } from '../services/vectorStore.js';
import { verifyAuth } from '../middleware/auth';

const router = express.Router();

// Apply auth middleware to all routes
router.use(verifyAuth);

// Process documents
router.post('/process', async (req, res, next) => {
  try {
    const { files } = req.body;
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No files provided'
      });
    }

    // Log request info
    console.log('Processing files:', {
      count: files.length,
      userId: req.user.id,
      files: files.map(f => f.split('/').pop())
    });

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

// Handle questions
router.post('/ask', async (req, res, next) => {
  try {
    const { question, chatHistory } = req.body;
    
    if (!question) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No question provided'
      });
    }

    // Log request info
    console.log('Question received:', {
      userId: req.user.id,
      question,
      historyLength: chatHistory?.length || 0
    });

    const response = await handleQuestion(question, chatHistory);
    res.json(response);
  } catch (error) {
    console.error('Ask error:', error);
    next(error);
  }
});

// Cleanup documents
router.post('/cleanup', async (req, res, next) => {
  try {
    console.log('Cleanup requested:', {
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
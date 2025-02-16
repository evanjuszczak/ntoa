import express from 'express';
import { processDocument, handleQuestion } from '../services/ai.service.js';
import { supabase } from '../config/supabase.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Middleware to verify authentication
const verifyAuth = async (req, res, next) => {
  try {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const authHeader = req.headers.authorization;
    console.log('Auth verification:', {
      hasAuthHeader: !!authHeader,
      method: req.method,
      path: req.path,
      origin: req.headers.origin,
      allHeaders: req.headers
    });

    if (!authHeader) {
      console.error('No authorization header present');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authorization header'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token verification attempt:', {
      tokenPrefix: token.substring(0, 20) + '...',
      headerPrefix: authHeader.substring(0, 20) + '...',
      tokenLength: token.length,
      headerLength: authHeader.length
    });

    // Log Supabase configuration
    console.log('Supabase config check:', {
      hasUrl: !!process.env.SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
      urlPrefix: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 20) + '...' : null,
      keyPrefix: process.env.SUPABASE_SERVICE_KEY ? process.env.SUPABASE_SERVICE_KEY.substring(0, 10) + '...' : null
    });

    // First try to get the user with the admin client
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error) {
        console.error('Token verification error:', {
          error: error,
          message: error.message,
          status: error.status,
          details: error.details,
          code: error.code
        });

        // If the error is related to an invalid token, try to decode it to get more info
        try {
          const [header, payload, signature] = token.split('.');
          const decodedHeader = JSON.parse(Buffer.from(header, 'base64').toString());
          const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
          
          console.log('Token debug info:', {
            header: decodedHeader,
            exp: new Date(decodedPayload.exp * 1000).toISOString(),
            iat: new Date(decodedPayload.iat * 1000).toISOString(),
            sub: decodedPayload.sub,
            role: decodedPayload.role
          });
        } catch (decodeError) {
          console.error('Failed to decode token:', decodeError);
        }

        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid token',
          details: error.message
        });
      }

      if (!user) {
        console.error('No user found for token');
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not found'
        });
      }

      console.log('Authentication successful:', {
        userId: user.id,
        email: user.email,
        lastSignIn: user.last_sign_in_at,
        role: user.role,
        appMetadata: user.app_metadata
      });

      // Add user data to request
      req.user = user;
      next();
    } catch (verifyError) {
      console.error('Token verification error:', {
        error: verifyError,
        message: verifyError.message,
        stack: verifyError.stack,
        code: verifyError.code
      });

      // Try to create a new Supabase client and verify again
      try {
        const newSupabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_KEY,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        );

        const { data: { user }, error: retryError } = await newSupabase.auth.getUser(token);

        if (retryError || !user) {
          throw retryError || new Error('User not found on retry');
        }

        console.log('Authentication successful on retry:', {
          userId: user.id,
          email: user.email
        });

        req.user = user;
        next();
      } catch (retryError) {
        console.error('Retry verification failed:', {
          error: retryError,
          message: retryError.message,
          stack: retryError.stack
        });
        
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid token format',
          details: verifyError.message
        });
      }
    }
  } catch (error) {
    console.error('Auth middleware error:', {
      error: error,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Server Error',
      message: 'Authentication check failed',
      details: error.message
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

    console.log('Processing files request:', {
      userId: req.user.id,
      fileCount: files.length,
      files: files.map(f => ({ url: f.substring(0, 20) + '...' }))
    });

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
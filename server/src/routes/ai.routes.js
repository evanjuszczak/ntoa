import express from 'express';
import { processDocument, handleQuestion } from '../services/ai.service.js';

const router = express.Router();

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
    next(error);
  }
});

export default router; 
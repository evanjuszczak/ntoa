import express from 'express';
import cors from 'cors';
import aiRoutes from './routes/ai.routes.js';

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Mount AI routes
app.use('/api', aiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Note AI API is running',
    version: '1.0.0'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Server Error',
    message: err.message
  });
});

export default app; 
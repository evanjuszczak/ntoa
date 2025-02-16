import express from 'express';
import cors from 'cors';
import aiRoutes from './routes/ai.routes.js';

const app = express();

// Enable CORS
app.use(cors());

// Basic middleware
app.use(express.json());

// Mount AI routes
app.use('/api', aiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
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
  console.error('Global error handler:', err);
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
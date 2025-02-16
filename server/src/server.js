import express from 'express';
import cors from 'cors';

const app = express();

// Enable CORS
app.use(cors());

// Basic middleware
app.use(express.json());

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

const port = process.env.PORT || 3000;

// Only start server if not running in Vercel
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

export default app; 
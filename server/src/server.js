import express from 'express';
import cors from 'cors';
import aiRoutes from './routes/ai.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json());

// Health check endpoint (before routes to bypass auth)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV || 'production' });
});

// Routes
app.use('/api', aiRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

// Error handling
app.use(errorHandler);

export default app; 
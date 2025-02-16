import express from 'express';
import cors from 'cors';
import aiRoutes from './routes/ai.routes.js';
import healthRoutes from './routes/health.routes.js';
import { verifyAuth } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://ntoa.vercel.app',
      'https://ntoa-5diyil6s2-evans-projects-6bc84f56.vercel.app',
      'http://localhost:5173',
      'http://localhost:5175',
      'http://localhost:3000'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 204,
  preflightContinue: false,
  maxAge: 86400
};

// Apply CORS middleware first
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));

// Health check route (no auth required)
app.use('/health', healthRoutes);

// Create API router
const apiRouter = express.Router();

// Apply auth middleware only to API routes (not to OPTIONS requests)
apiRouter.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  return verifyAuth(req, res, next);
});

// Apply routes
apiRouter.use('/', aiRoutes);

// Mount API router
app.use('/api', apiRouter);

// Error handling middleware
app.use(errorHandler);

export default app; 
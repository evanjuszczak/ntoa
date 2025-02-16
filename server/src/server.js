import express from 'express';
import aiRoutes from './routes/ai.routes.js';
import healthRoutes from './routes/health.routes.js';
import { verifyAuth } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));

// Health check route (no auth required)
app.use('/health', healthRoutes);

// Create API router
const apiRouter = express.Router();

// Apply auth middleware (skipping OPTIONS requests)
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
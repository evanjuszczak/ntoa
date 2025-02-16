const express = require('express');
const cors = require('cors');
const aiRoutes = require('./routes/ai.routes');
const { errorHandler } = require('./middleware/errorHandler');

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

const port = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

module.exports = app; 
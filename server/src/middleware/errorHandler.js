const errorHandler = (err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message
    });
  }

  if (err.name === 'AuthenticationError') {
    return res.status(401).json({
      error: 'Authentication Error',
      message: err.message
    });
  }

  // Handle database errors
  if (err.code && err.code.startsWith('23')) {
    return res.status(400).json({
      error: 'Database Error',
      message: 'Invalid data provided'
    });
  }

  // Default error response
  res.status(500).json({
    error: 'Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred'
      : err.message
  });
};

export default errorHandler; 
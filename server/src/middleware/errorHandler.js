const errorHandler = (err, req, res, next) => {
  // Log detailed error information
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    headers: req.headers,
    env: process.env.NODE_ENV
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.details || null
    });
  }

  if (err.name === 'AuthenticationError' || err.name === 'AuthApiError') {
    return res.status(401).json({
      error: 'Authentication Error',
      message: err.message,
      details: process.env.NODE_ENV === 'development' ? err.details : null
    });
  }

  // Handle file processing errors
  if (err.message && (
    err.message.includes('Failed to fetch file') ||
    err.message.includes('Failed to save temp file') ||
    err.message.includes('No content could be extracted')
  )) {
    return res.status(400).json({
      error: 'File Processing Error',
      message: err.message,
      details: process.env.NODE_ENV === 'development' ? err.details : null
    });
  }

  // Handle database errors
  if (err.code && err.code.startsWith('23')) {
    return res.status(400).json({
      error: 'Database Error',
      message: 'Invalid data provided',
      details: process.env.NODE_ENV === 'development' ? err.details : null
    });
  }

  // Handle Supabase specific errors
  if (err.message && err.message.includes('Supabase')) {
    return res.status(500).json({
      error: 'Database Service Error',
      message: 'Error connecting to database service',
      details: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }

  // Default error response
  res.status(500).json({
    error: 'Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred'
      : err.message,
    details: process.env.NODE_ENV === 'development' ? {
      stack: err.stack,
      code: err.code
    } : null
  });
};

export default errorHandler; 
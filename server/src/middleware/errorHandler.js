export const errorHandler = (err, req, res, next) => {
  console.error('Error caught by handler:', {
    message: err.message,
    stack: err.stack,
    name: err.name,
    code: err.code,
    status: err.status
  });

  // Handle specific error types
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: err.message,
      hint: 'Please check your authentication token'
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Bad Request',
      message: err.message,
      hint: 'Please check your request parameters'
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: err.name || 'Server Error',
    message: err.message || 'An unexpected error occurred',
    hint: err.hint || 'Please try again later'
  });
}; 
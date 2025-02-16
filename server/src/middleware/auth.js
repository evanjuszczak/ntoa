import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export const verifyAuth = async (req, res, next) => {
  try {
    // Skip auth for OPTIONS requests
    if (req.method === 'OPTIONS') {
      return next();
    }

    // Skip auth in development
    if (process.env.NODE_ENV === 'development') {
      req.user = { id: 'dev-user', email: 'dev@example.com' };
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Auth error:', error?.message || 'No user found');
      return res.status(401).json({
        error: 'Unauthorized',
        message: error?.message || 'Invalid authentication token'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
}; 
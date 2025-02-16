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
    // Always skip auth for OPTIONS requests and health check
    if (req.method === 'OPTIONS' || req.path === '/health') {
      return next();
    }

    // Skip auth in development
    if (process.env.NODE_ENV === 'development') {
      req.user = { id: 'dev-user', email: 'dev@example.com' };
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Auth failed: Missing or invalid authorization header');
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Auth failed:', error || 'No user found');
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}; 
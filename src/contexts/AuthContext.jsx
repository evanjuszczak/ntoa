import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    // Check for initial session
    const checkSession = async () => {
      try {
        console.log('Checking initial session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session check error:', {
            error: sessionError,
            message: sessionError.message,
            details: sessionError.details,
            status: sessionError.status
          });
          throw sessionError;
        }
        
        console.log('Session check result:', {
          hasSession: !!session,
          userEmail: session?.user?.email,
          sessionExpiry: session?.expires_at,
          accessToken: session?.access_token ? 'present' : 'missing'
        });
        
        if (mounted) {
          setUser(session?.user ?? null);
          
          // If we have a session, navigate to dashboard
          if (session?.user) {
            console.log('Found existing session, navigating to dashboard');
            navigate('/dashboard');
          }
        }
      } catch (err) {
        console.error('Session check error:', {
          error: err,
          message: err.message,
          stack: err.stack
        });
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', {
        event,
        userEmail: session?.user?.email,
        timestamp: new Date().toISOString(),
        sessionExpiry: session?.expires_at,
        accessToken: session?.access_token ? 'present' : 'missing'
      });
      
      if (mounted) {
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN') {
          console.log('User signed in, navigating to dashboard');
          navigate('/dashboard');
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out, navigating to login');
          navigate('/login');
        }
      }
    });

    return () => {
      console.log('Cleaning up auth subscriptions');
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [navigate]);

  const signup = async (email, password, signupCode) => {
    try {
      console.log('Starting signup process...');
      setError(null);
      
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Verify signup code
      const VALID_SIGNUP_CODE = 'N';
      if (signupCode !== VALID_SIGNUP_CODE) {
        throw new Error('Invalid signup code. Please contact the administrator.');
      }

      setLoading(true);
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (signupError) {
        console.error('Signup error:', {
          error: signupError,
          message: signupError.message,
          details: signupError.details,
          status: signupError.status
        });
        throw signupError;
      }

      if (!data?.user) {
        throw new Error('Signup failed. Please try again.');
      }

      console.log('Signup successful:', {
        userEmail: data.user.email,
        timestamp: new Date().toISOString(),
        userId: data.user.id
      });

      return { user: data.user, error: null };
    } catch (error) {
      console.error('Signup error:', {
        error: error,
        message: error.message,
        stack: error.stack
      });
      setError(error.message);
      return { 
        user: null, 
        error: error
      };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Starting login process...');
      setError(null);
      
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      setLoading(true);
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (loginError) {
        console.error('Login error:', {
          error: loginError,
          message: loginError.message,
          details: loginError.details,
          status: loginError.status
        });
        throw loginError;
      }

      if (!data?.user) {
        throw new Error('Login failed. Please try again.');
      }

      console.log('Login successful:', {
        userEmail: data.user.email,
        timestamp: new Date().toISOString(),
        userId: data.user.id,
        sessionExpiry: data.session?.expires_at
      });

      return { user: data.user, error: null };
    } catch (error) {
      console.error('Login error:', {
        error: error,
        message: error.message,
        stack: error.stack
      });
      setError(error.message);
      return { 
        user: null, 
        error: error
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('Starting logout process...');
      setError(null);
      setLoading(true);
      
      const { error: logoutError } = await supabase.auth.signOut();
      if (logoutError) {
        console.error('Logout error:', {
          error: logoutError,
          message: logoutError.message,
          details: logoutError.details,
          status: logoutError.status
        });
        throw logoutError;
      }
      
      console.log('Logout successful');
      return { error: null };
    } catch (error) {
      console.error('Logout error:', {
        error: error,
        message: error.message,
        stack: error.stack
      });
      setError(error.message);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    error,
    loading,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 
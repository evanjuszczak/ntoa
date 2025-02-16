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

    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            navigate('/dashboard');
          }
        }
      } catch (err) {
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN') {
          navigate('/dashboard');
        } else if (event === 'SIGNED_OUT') {
          navigate('/login');
        }
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [navigate]);

  const signup = async (email, password, signupCode) => {
    try {
      setError(null);
      
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

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

      if (signupError) throw signupError;
      if (!data?.user) throw new Error('Signup failed. Please try again.');

      return { user: data.user, error: null };
    } catch (error) {
      setError(error.message);
      return { user: null, error };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      setLoading(true);
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (loginError) throw loginError;
      if (!data?.user) throw new Error('Login failed. Please try again.');

      return { user: data.user, error: null };
    } catch (error) {
      setError(error.message);
      return { user: null, error };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const { error: logoutError } = await supabase.auth.signOut();
      if (logoutError) throw logoutError;
      
      return { error: null };
    } catch (error) {
      setError(error.message);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 
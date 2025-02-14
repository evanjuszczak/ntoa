import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';

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

  const signup = async (email, password, signupCode) => {
    try {
      if (!email || !password) {
        return { 
          user: null, 
          error: new Error('Email and password are required') 
        };
      }

      // Verify signup code
      const VALID_SIGNUP_CODE = 'N';
      if (signupCode !== VALID_SIGNUP_CODE) {
        return {
          user: null,
          error: new Error('Invalid signup code. Please contact the administrator.')
        };
      }

      setLoading(true);
      const { data, error: supabaseError } = await supabase.auth.signUp({
        email,
        password
      });

      if (supabaseError) {
        let errorMessage;
        
        if (supabaseError.message.includes('Password should be')) {
          errorMessage = 'Password should be at least 6 characters long';
        } else if (supabaseError.message.includes('User already registered')) {
          errorMessage = 'This email is already registered. Please try logging in instead.';
        } else if (supabaseError.message.includes('rate limit')) {
          errorMessage = 'Too many signup attempts. Please try again later.';
        } else {
          errorMessage = supabaseError.message;
        }
        
        return { 
          user: null, 
          error: new Error(errorMessage)
        };
      }

      if (!data?.user) {
        return {
          user: null,
          error: new Error('Signup failed. Please try again.')
        };
      }

      return { 
        user: data.user, 
        error: null 
      };
    } catch (error) {
      console.error('Unexpected signup error:', error);
      return { 
        user: null, 
        error: new Error('An unexpected error occurred. Please try again later.')
      };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      if (!email || !password) {
        return { 
          user: null, 
          error: new Error('Email and password are required') 
        };
      }

      setLoading(true);

      const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (supabaseError || !data?.user) {
        let errorMessage;
        
        if (supabaseError?.message?.toLowerCase().includes('invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (supabaseError?.message?.toLowerCase().includes('email not confirmed')) {
          errorMessage = 'Please confirm your email address before logging in.';
        } else if (supabaseError?.status === 400 || supabaseError?.status === 403) {
          errorMessage = 'Invalid login credentials. Please check your email and password.';
        } else if (supabaseError?.message?.toLowerCase().includes('rate limit')) {
          errorMessage = 'Too many login attempts. Please try again later.';
        } else {
          errorMessage = 'Login failed. Please check your credentials and try again.';
        }
        
        return { 
          user: null, 
          error: new Error(errorMessage)
        };
      }
      
      return { user: data.user, error: null };
    } catch (error) {
      return { 
        user: null, 
        error: new Error('An unexpected error occurred. Please try again.')
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check for initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    signup,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 
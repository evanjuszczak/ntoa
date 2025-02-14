import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Tab,
  Tabs,
  useTheme,
  useMediaQuery,
  CssBaseline,
  IconButton,
} from '@mui/material';
import { 
  LightMode, 
  DarkMode,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import Logo from '../components/Logo';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupCode, setSignupCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(0);
  const { login, signup, user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { mode, toggleColorMode } = useThemeContext();

  // Log auth state for debugging
  useEffect(() => {
    console.log('Login component auth state:', {
      hasUser: !!user,
      userEmail: user?.email,
      loading,
      error
    });
  }, [user, loading, error]);

  const validateEmail = (email) => {
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const validateForm = () => {
    if (tab === 1 && !signupCode) {
      setError('Please enter the signup code');
      return false;
    }
    if (!email && !password) {
      setError('Please enter both email and password');
      return false;
    }
    if (!email) {
      setError('Please enter your email');
      return false;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!password) {
      setError('Please enter your password');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (loading) return;

    setError('');
    
    if (!validateForm()) return;

    setLoading(true);
    console.log('Attempting authentication:', {
      isLogin: tab === 0,
      email
    });

    try {
      const result = tab === 0 
        ? await login(email, password)
        : await signup(email, password, signupCode);
      
      console.log('Authentication result:', {
        success: !!result.user,
        hasError: !!result.error,
        errorMessage: result.error?.message
      });

      if (result.error) {
        setError(result.error.message);
        setLoading(false);
        return;
      }

      if (!result.user) {
        setError('Authentication failed. Please try again.');
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleTabChange = (_, newValue) => {
    setTab(newValue);
    setError('');
    setEmail('');
    setPassword('');
    setSignupCode('');
  };

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.palette.background.default,
          m: 0,
          p: 0,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      >
        <Button
          component={Link}
          to="/"
          startIcon={<ArrowBackIcon />}
          sx={{
            position: 'absolute',
            top: 24,
            left: 24,
            color: theme.palette.text.primary,
            bgcolor: mode === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
            '&:hover': {
              bgcolor: mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
            },
            textTransform: 'none',
            fontWeight: 500,
          }}
        >
          Back to Home
        </Button>

        <IconButton
          onClick={toggleColorMode}
          sx={{
            position: 'absolute',
            top: 24,
            right: 24,
            bgcolor: mode === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
            '&:hover': {
              bgcolor: mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
            },
            width: 40,
            height: 40,
          }}
        >
          {mode === 'light' ? <DarkMode /> : <LightMode />}
        </IconButton>

        <Container
          maxWidth={false}
          disableGutters
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            m: 0,
            p: { xs: 2, sm: 3 },
            boxSizing: 'border-box'
          }}
        >
          <Paper 
            elevation={3} 
            sx={{
              width: '100%',
              maxWidth: '450px',
              p: { xs: 3, sm: 4 },
              borderRadius: 2,
              backgroundColor: theme.palette.background.paper
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
              }}
            >
              <Logo size={64} sx={{ mb: 2 }} />
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom 
                textAlign="center"
                sx={{
                  fontSize: isMobile ? '1.75rem' : '2.125rem',
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  mb: 2
                }}
              >
                {tab === 0 ? 'Welcome Back' : 'Create Account'}
              </Typography>

              <Typography 
                variant="body1" 
                textAlign="center" 
                color="text.secondary"
                sx={{ mb: 3 }}
              >
                {tab === 0 
                  ? 'Sign in to access your notes and continue your work' 
                  : 'Join us to start organizing your notes with AI'}
              </Typography>

              <Tabs
                value={tab}
                onChange={handleTabChange}
                centered
                sx={{
                  mb: 3,
                  width: '100%',
                  '& .MuiTabs-indicator': {
                    height: 3,
                    borderRadius: '3px 3px 0 0'
                  },
                  '& .MuiTab-root': {
                    fontSize: isMobile ? '0.875rem' : '1rem',
                    fontWeight: 500,
                    px: isMobile ? 2 : 4,
                    flex: 1
                  }
                }}
              >
                <Tab 
                  label="Login" 
                  sx={{ 
                    textTransform: 'none',
                    minWidth: isMobile ? 100 : 120
                  }} 
                />
                <Tab 
                  label="Sign Up" 
                  sx={{ 
                    textTransform: 'none',
                    minWidth: isMobile ? 100 : 120
                  }} 
                />
              </Tabs>

              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    width: '100%',
                    mb: 2
                  }}
                  onClose={() => setError('')}
                >
                  {error}
                </Alert>
              )}

              <Box 
                component="form" 
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSubmit();
                }}
                noValidate
                sx={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2.5
                }}
              >
                {tab === 1 && (
                  <TextField
                    label="Signup Code"
                    type="password"
                    fullWidth
                    value={signupCode}
                    onChange={(e) => {
                      setSignupCode(e.target.value);
                      setError('');
                    }}
                    required
                    disabled={loading}
                    error={!!error && error.toLowerCase().includes('code')}
                    helperText={error && error.toLowerCase().includes('code') ? error : ' '}
                    inputProps={{
                      'data-testid': 'signup-code-input'
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5
                      }
                    }}
                  />
                )}
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  required
                  disabled={loading}
                  autoComplete="email"
                  error={!!error}
                  helperText={error && error.toLowerCase().includes('email') ? error : ' '}
                  inputProps={{
                    'data-testid': 'email-input'
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5
                    }
                  }}
                />
                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  error={!!error}
                  helperText={error && error.toLowerCase().includes('password') ? error : ' '}
                  inputProps={{
                    'data-testid': 'password-input'
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5
                    }
                  }}
                />
                {tab === 0 && (
                  <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', mt: -2 }}>
                    <Button
                      component={Link}
                      to="/forgot-password"
                      sx={{
                        textTransform: 'none',
                        color: theme.palette.text.secondary,
                        '&:hover': {
                          backgroundColor: 'transparent',
                          color: theme.palette.text.primary,
                        }
                      }}
                    >
                      Forgot Password?
                    </Button>
                  </Box>
                )}
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading}
                  data-testid="submit-button"
                  sx={{
                    mt: 1,
                    py: 1.5,
                    borderRadius: 1.5,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    boxShadow: 'none',
                    '&:hover': {
                      boxShadow: 'none'
                    }
                  }}
                >
                  {loading ? 'Please wait...' : (tab === 0 ? 'Sign In' : 'Create Account')}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>
    </>
  );
};

export default Login; 
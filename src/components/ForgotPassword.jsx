import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  IconButton,
  CssBaseline,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  LightMode,
  DarkMode,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useThemeContext } from '../contexts/ThemeContext';
import Logo from './Logo';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' });
  const theme = useTheme();
  const { mode, toggleColorMode } = useThemeContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage({ text: 'Please enter your email address', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      setMessage({ text: '', type: 'info' });

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      setMessage({
        text: 'Password reset instructions have been sent to your email',
        type: 'success'
      });
      setEmail('');
    } catch (error) {
      setMessage({
        text: error.message || 'An error occurred while sending reset instructions',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
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
          to="/login"
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
          Back to Login
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
                  fontSize: { xs: '1.75rem', sm: '2.125rem' },
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  mb: 2
                }}
              >
                Reset Password
              </Typography>

              <Typography
                variant="body1"
                textAlign="center"
                color="text.secondary"
                sx={{ mb: 3 }}
              >
                Enter your email address and we'll send you instructions to reset your password.
              </Typography>

              {message.text && (
                <Alert
                  severity={message.type}
                  sx={{ width: '100%', mb: 2 }}
                  onClose={() => setMessage({ text: '', type: 'info' })}
                >
                  {message.text}
                </Alert>
              )}

              <Box
                component="form"
                onSubmit={handleSubmit}
                noValidate
                sx={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2.5
                }}
              >
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="email"
                  error={message.type === 'error'}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5
                    }
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading}
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
                  {loading ? 'Sending...' : 'Send Reset Instructions'}
                </Button>

                <Button
                  component={Link}
                  to="/login"
                  sx={{
                    textTransform: 'none',
                    textDecoration: 'none',
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      backgroundColor: 'transparent',
                      color: theme.palette.text.primary,
                    }
                  }}
                >
                  Back to Login
                </Button>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>
    </>
  );
};

export default ForgotPassword; 
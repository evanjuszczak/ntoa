import { IconButton, Tooltip } from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import { useThemeContext } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { mode, toggleColorMode } = useThemeContext();

  return (
    <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
      <IconButton
        onClick={toggleColorMode}
        color="inherit"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          bgcolor: mode === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
          '&:hover': {
            bgcolor: mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
          },
          backdropFilter: 'blur(8px)',
          borderRadius: '50%',
          width: 48,
          height: 48,
        }}
      >
        {mode === 'light' ? <DarkMode /> : <LightMode />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle; 
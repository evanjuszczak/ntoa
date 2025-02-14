import { createContext, useContext, useState, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Pink theme settings
const pinkTheme = {
  light: {
    primary: {
      main: '#FF69B4',
      light: '#FFB6C1',
      dark: '#FF1493',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FFF0F5',
      paper: '#FFE4E1',
      secondary: '#FFF5F8',
    },
    text: {
      primary: '#FF1493',
      secondary: '#FF69B4',
    },
    divider: 'rgba(255, 20, 147, 0.08)',
  },
  dark: {
    primary: {
      main: '#FF69B4',
      light: '#FFB6C1',
      dark: '#FF1493',
      contrastText: '#000000',
    },
    background: {
      default: '#1A0011',
      paper: '#2D001C',
      secondary: '#3D0026',
    },
    text: {
      primary: '#FFB6C1',
      secondary: '#FF69B4',
    },
    divider: 'rgba(255, 105, 180, 0.08)',
  }
};

// Base theme settings
const getDesignTokens = (mode, isPinkTheme = false) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? isPinkTheme 
        ? pinkTheme.light
        : {
            // Light mode
            primary: {
              main: '#1A1A1A',
              light: '#2A2A2A',
              dark: '#0A0A0A',
              contrastText: '#FFFFFF',
            },
            background: {
              default: '#FFFFFF',
              paper: '#F5F5F5',
              secondary: '#FAFAFA',
            },
            text: {
              primary: '#1A1A1A',
              secondary: '#666666',
            },
            divider: 'rgba(0, 0, 0, 0.08)',
          }
      : isPinkTheme
        ? pinkTheme.dark
        : {
            // Dark mode
            primary: {
              main: '#FFFFFF',
              light: '#FFFFFF',
              dark: '#CCCCCC',
              contrastText: '#000000',
            },
            background: {
              default: '#000000',
              paper: '#141414',
              secondary: '#1A1A1A',
            },
            text: {
              primary: '#FFFFFF',
              secondary: '#AAAAAA',
            },
            divider: 'rgba(255, 255, 255, 0.08)',
          }),
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    subtitle1: {
      letterSpacing: '-0.01em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          padding: '8px 16px',
        },
        contained: {
          backgroundColor: isPinkTheme ? '#FF69B4' : (mode === 'light' ? '#1A1A1A' : '#FFFFFF'),
          color: isPinkTheme ? '#FFFFFF' : (mode === 'light' ? '#FFFFFF' : '#000000'),
          '&:hover': {
            backgroundColor: isPinkTheme ? '#FF1493' : (mode === 'light' ? '#2A2A2A' : '#EEEEEE'),
          },
        },
        outlined: {
          borderColor: isPinkTheme 
            ? 'rgba(255, 105, 180, 0.5)'
            : (mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)'),
          '&:hover': {
            backgroundColor: isPinkTheme
              ? 'rgba(255, 105, 180, 0.08)'
              : (mode === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)'),
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: mode === 'light' 
            ? (isPinkTheme ? '#FFE4E1' : '#F5F5F5')
            : (isPinkTheme ? '#2D001C' : '#141414'),
          borderRadius: 16,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: mode === 'light'
            ? (isPinkTheme ? '#FFE4E1' : '#F5F5F5')
            : (isPinkTheme ? '#2D001C' : '#141414'),
          borderRadius: 16,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&:hover': {
            backgroundColor: isPinkTheme
              ? 'rgba(255, 105, 180, 0.08)'
              : (mode === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)'),
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: isPinkTheme ? '#FF69B4' : (mode === 'light' ? '#666666' : '#AAAAAA'),
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: isPinkTheme
              ? 'rgba(255, 105, 180, 0.05)'
              : (mode === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)'),
            '&:hover': {
              backgroundColor: isPinkTheme
                ? 'rgba(255, 105, 180, 0.08)'
                : (mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'),
            },
            '& fieldset': {
              borderColor: isPinkTheme
                ? 'rgba(255, 105, 180, 0.2)'
                : (mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)'),
            },
          },
        },
      },
    },
  },
});

const ThemeContext = createContext({ toggleColorMode: () => {}, isPinkTheme: false });

export const useThemeContext = () => {
  return useContext(ThemeContext);
};

export const ThemeContextProvider = ({ children }) => {
  const [mode, setMode] = useState('dark');
  const [isPinkTheme, setIsPinkTheme] = useState(false);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
        if (isPinkTheme) {
          setIsPinkTheme(false);
        }
      },
      togglePinkTheme: () => {
        setIsPinkTheme(prev => !prev);
      },
      mode,
      isPinkTheme,
    }),
    [mode, isPinkTheme],
  );

  const theme = useMemo(() => createTheme(getDesignTokens(mode, isPinkTheme)), [mode, isPinkTheme]);

  return (
    <ThemeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}; 
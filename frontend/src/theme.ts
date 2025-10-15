import { createTheme } from '@mui/material/styles';

// Create a custom Material Design 3 inspired theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0c4a6e', // sky-950
      light: '#0369a1',
      dark: '#082f49',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2563eb', // blue-600
      light: '#3b82f6',
      dark: '#1d4ed8',
      contrastText: '#ffffff',
    },
    background: {
      default: '#fafaf9', // stone-50
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
    },
    success: {
      main: '#16a34a',
      light: '#22c55e',
      dark: '#15803d',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: '#dc2626',
      light: '#ef4444',
      dark: '#b91c1c',
    },
    info: {
      main: '#0284c7',
      light: '#0ea5e9',
      dark: '#0369a1',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", sans-serif',
    h1: {
      fontFamily: '"Merriweather", "Georgia", serif',
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontFamily: '"Merriweather", "Georgia", serif',
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.3,
    },
    h4: {
      fontWeight: 700,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 700,
      fontSize: '1.375rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 700,
      fontSize: '1.125rem',
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.57,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
    },
    button: {
      fontWeight: 500,
      fontSize: '0.875rem',
      textTransform: 'none', // Material Design 3 style
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: '#cbd5e1 #f1f5f9',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            width: 8,
            height: 8,
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: '#cbd5e1',
            minHeight: 24,
          },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#94a3b8',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 20px',
          fontSize: '0.875rem',
          fontWeight: 500,
          textTransform: 'none',
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
        },
        contained: {
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.12)',
          },
        },
      },
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)',
            transform: 'translateY(-4px)',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '28px',
          '&:last-child': {
            paddingBottom: '28px',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        },
        elevation2: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#94a3b8',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          height: 36,
          fontSize: '0.9375rem',
          '&.MuiChip-sizeMedium': {
            height: 36,
            fontSize: '0.9375rem',
          },
          '&.MuiChip-sizeSmall': {
            height: 28,
            fontSize: '0.875rem',
          },
        },
        colorPrimary: {
          backgroundColor: '#e3f2fd',
          color: '#0d47a1',
          '&:hover': {
            backgroundColor: '#bbdefb',
          },
        },
        colorSecondary: {
          backgroundColor: '#f3e5f5',
          color: '#6a1b9a',
          '&:hover': {
            backgroundColor: '#e1bee7',
          },
        },
        colorSuccess: {
          backgroundColor: '#e8f5e9',
          color: '#2e7d32',
          '&:hover': {
            backgroundColor: '#c8e6c9',
          },
        },
        colorError: {
          backgroundColor: '#ffebee',
          color: '#c62828',
          '&:hover': {
            backgroundColor: '#ffcdd2',
          },
        },
        colorWarning: {
          backgroundColor: '#fff3e0',
          color: '#ef6c00',
          '&:hover': {
            backgroundColor: '#ffe0b2',
          },
        },
        colorInfo: {
          backgroundColor: '#e1f5fe',
          color: '#01579b',
          '&:hover': {
            backgroundColor: '#b3e5fc',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          borderRadius: 0,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          minWidth: 'auto',
          padding: '12px 20px',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.25rem',
          fontWeight: 600,
          padding: '20px 24px 16px',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #e2e8f0',
          padding: '16px',
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#f8fafc',
          fontSize: '0.875rem',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.15s ease-in-out',
          '&:hover': {
            backgroundColor: '#f8fafc',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'all 0.15s ease-in-out',
          '&:hover': {
            backgroundColor: 'rgba(12, 74, 110, 0.04)',
          },
        },
      },
    },
  },
});

export default theme;


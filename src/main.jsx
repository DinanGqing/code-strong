import React from 'react';
// v2 force rebuild 20260527
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import './index.css';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#00B4D8', light: '#00D4FF', dark: '#0077B6' },
    secondary: { main: '#9B59B6' },
    background: { default: '#0a0a1a', paper: 'rgba(18, 18, 42, 0.9)' },
    text: { primary: '#e0e0e0', secondary: '#a0a0b0' },
  },
  typography: { fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif' },
  components: { MuiCard: { styleOverrides: { root: { backgroundImage: 'none' } } } },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from '../shared/contexts/AuthContext';
import { ThemeModeProvider, useThemeMode } from '../shared/contexts/ThemeModeContext';
import App from './App';
import '../index.css';

/** 浅色主题 — 柔和暖白，不刺眼 */
const LIGHT_THEME = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#00B4D8', light: '#00D4FF', dark: '#0077B6' },
    secondary: { main: '#9B59B6' },
    background: { default: '#f0f0f0', paper: '#f8f8fa' },
    text: { primary: '#1a1a2e', secondary: '#666680' },
  },
  typography: { fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif' },
  components: {
    MuiCard: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiDialog: { styleOverrides: { paper: { backgroundImage: 'none' } } },
  },
});

/** 深色主题 */
const DARK_THEME = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#00B4D8', light: '#00D4FF', dark: '#0077B6' },
    secondary: { main: '#9B59B6' },
    background: { default: '#0a0a1a', paper: 'rgba(18, 18, 42, 0.9)' },
    text: { primary: '#e0e0e0', secondary: '#a0a0b0' },
  },
  typography: { fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif' },
  components: {
    MuiCard: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiDialog: { styleOverrides: { paper: { backgroundImage: 'none' } } },
  },
});

/**
 * 根据主题模式选择主题
 */
function ThemedApp() {
  const { mode } = useThemeMode();
  const theme = mode === 'dark' ? DARK_THEME : LIGHT_THEME;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeModeProvider>
        <ThemedApp />
      </ThemeModeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

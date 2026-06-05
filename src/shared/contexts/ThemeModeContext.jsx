import { createContext, useContext, useState, useEffect } from 'react';

const ThemeModeContext = createContext();

/** 深色模式 CSS 覆盖（对硬编码的 inline sx 做兜底） */
const DARK_MODE_CSS = `
.theme-dark body,
.theme-dark .MuiPaper-root,
.theme-dark .MuiDialog-paper,
.theme-dark .MuiDrawer-paper {
  background-color: rgba(18, 18, 42, 0.95) !important;
  color: #e0e0e0 !important;
}

.theme-dark .MuiTypography-root {
  color: #e0e0e0 !important;
}

.theme-dark .MuiBottomNavigationAction-root {
  color: rgba(255,255,255,0.4) !important;
}
.theme-dark .MuiBottomNavigationAction-root.Mui-selected {
  color: #00D4FF !important;
}

.theme-dark .MuiOutlinedInput-notchedOutline {
  border-color: rgba(0,180,216,0.3) !important;
}

.theme-dark .MuiInputLabel-root {
  color: rgba(255,255,255,0.5) !important;
}

/* 滚动条 */
.theme-dark ::-webkit-scrollbar-track {
  background: #0a0a1a !important;
}
`;

export function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('themeMode') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
    // 切换 body 类名
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add('theme-' + mode);

    // 添加/移除深色模式 CSS 覆盖
    let style = document.getElementById('dark-mode-override');
    if (mode === 'dark') {
      if (!style) {
        style = document.createElement('style');
        style.id = 'dark-mode-override';
        style.textContent = DARK_MODE_CSS;
        document.head.appendChild(style);
      }
    } else {
      if (style) style.remove();
    }
  }, [mode]);

  const toggleMode = () => {
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      {children}
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  return useContext(ThemeModeContext);
}
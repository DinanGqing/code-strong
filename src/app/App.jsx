import { useState, lazy, Suspense, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Box, CircularProgress, useTheme } from '@mui/material';
import { useAuth } from '../shared/contexts/AuthContext';
import { useThemeMode } from '../shared/contexts/ThemeModeContext';
import AppHeader from './components/AppHeader';
import BottomNav from './components/BottomNav';
import LoginModal from '../shared/components/LoginModal';
import RegisterModal from '../shared/components/RegisterModal';
import ForgotPasswordModal from '../shared/components/ForgotPasswordModal';

// 懒加载页面组件
const Home = lazy(() => import('./pages/Home'));
const Skills = lazy(() => import('./pages/Skills'));
const Agents = lazy(() => import('./pages/Agents'));
const ToolsDownload = lazy(() => import('./pages/ToolsDownload'));
const Games = lazy(() => import('./pages/Games'));
const AccountSettings = lazy(() => import('./pages/AccountSettings'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));
const Feedback = lazy(() => import('./pages/Feedback'));
const Social = lazy(() => import('./pages/Social'));
const Chat = lazy(() => import('./pages/Chat'));
const ChannelChat = lazy(() => import('./pages/ChannelChat'));

// 新 Tab 页面
const Messages = lazy(() => import('./pages/Messages'));
const Channels = lazy(() => import('./pages/Channels'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));

/**
 * 页面加载中占位组件
 */
function PageLoading() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress sx={{ color: '#00D4FF' }} />
    </Box>
  );
}

// 底部导航应隐藏的路径
const HIDE_HEADER_PATHS = [/^\/chat\//, /^\/channel\//];

/**
 * APP 端 App 根组件
 * 布局: 顶部 Header + 内容区 + 底部 Tab 导航
 */
export default function App() {
  const { user, logout } = useAuth();
  const { mode } = useThemeMode();
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const navStack = useRef(['/']);
  const isNavigating = useRef(false);

  // 追踪路由变化，维护导航栈
  useEffect(() => {
    if (isNavigating.current) {
      isNavigating.current = false;
      return;
    }
    const current = location.pathname;
    const prev = navStack.current[navStack.current.length - 1];
    if (current !== prev) {
      navStack.current.push(current);
    }
  }, [location.pathname]);

  // StatusBar — 根据主题模式动态适配（双保险）
  useEffect(() => {
    let cancelled = false;
    const updateStatusBar = async () => {
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        StatusBar.setOverlaysWebView({ overlay: false });
        if (mode === 'dark') {
          StatusBar.setStyle({ style: Style.Light });
          StatusBar.setBackgroundColor({ color: '#0d0d2b' });
        } else {
          StatusBar.setStyle({ style: Style.Dark });
          StatusBar.setBackgroundColor({ color: '#ffffff' });
        }
        const { height } = await StatusBar.getInfo();
        document.documentElement.style.setProperty('--status-bar-height', height + 'px');
      } catch (e) {
        console.warn('StatusBar plugin not available', e);
      }

      // 原生 JS Bridge 兜底（某些 ROM 上 Capacitor setStyle 不生效时）
      // 尝试多次确保 Bridge 已注册
      const tryBridge = (attempt = 0) => {
        if (cancelled) return;
        try {
          if (window.AppStatusBar) {
            window.AppStatusBar.setLightStatusBars(mode !== 'dark');
          } else if (attempt < 10) {
            setTimeout(() => tryBridge(attempt + 1), 100);
          }
        } catch (e) {
          if (attempt < 10) {
            setTimeout(() => tryBridge(attempt + 1), 100);
          }
        }
      };
      tryBridge();
    };
    updateStatusBar();
    return () => { cancelled = true; };
  }, [mode]);

  // 返回手势控制（仅初始化一次）
  // 优先触发 Dialog 关闭（通过自定义事件），再执行路由返回
  useEffect(() => {
    const setupBackButton = async () => {
      try {
        const { App: CapApp } = await import('@capacitor/app');
        CapApp.addListener('backButton', () => {
          // 先尝试关闭顶层 Dialog（如扫描、弹窗等）
          let handled = false;
          try {
            const evt = new CustomEvent('backbutton', { cancelable: true });
            handled = !window.dispatchEvent(evt);
          } catch {}
          if (handled) return;

          // 再执行路由返回
          const stack = navStack.current;
          if (stack.length > 1) {
            stack.pop();
            const prev = stack[stack.length - 1];
            isNavigating.current = true;
            navigate(prev, { replace: true });
          } else {
            CapApp.minimizeApp();
          }
        });
      } catch {}
    };
    setupBackButton();
  }, [navigate]);

  const handleOpenLogin = () => {
    setRegisterOpen(false);
    setLoginOpen(true);
  };

  const handleOpenRegister = () => {
    setLoginOpen(false);
    setRegisterOpen(true);
  };

  const handleCloseLogin = () => { setLoginOpen(false); };
  const handleCloseRegister = () => { setRegisterOpen(false); };

  // 在聊天详情页隐藏顶部 Header
  const hideHeader = HIDE_HEADER_PATHS.some((re) => re.test(location.pathname));
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', position: 'relative', bgcolor: theme.palette.mode === 'dark' ? '#0a0a1a' : '#f0f0f0' }}>
      {/* 顶部 Header — 聊天详情页隐藏 */}
      {!hideHeader && (
        <AppHeader
          user={user}
          onLoginClick={handleOpenLogin}
          onRegisterClick={handleOpenRegister}
          onLogout={logout}
        />
      )}

      {/* 主内容区 — 独立滚动容器 */}
      <Box
        component="main"
        sx={{
          flex: 1,
          position: 'relative',
          zIndex: 1,
          bgcolor: theme.palette.mode === 'dark' ? 'transparent' : '#f0f0f0',
          paddingTop: hideHeader ? 0 : 'calc(64px + var(--status-bar-height, 24px))',
          paddingBottom: '72px',
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Suspense fallback={<PageLoading />}>
          <Routes>
            {/* Tab 页面 — 首页重定向到消息 */}
            <Route path="/" element={<Navigate to="/messages" replace />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/channels" element={<Channels />} />
            <Route path="/ai" element={<AIAssistant />} />
            <Route path="/skills" element={<Skills />} />

            {/* 原有页面 */}
            <Route path="/agents" element={<Agents />} />
            <Route path="/tools" element={<ToolsDownload />} />
            <Route path="/games" element={<Games />} />
            <Route path="/settings" element={<AccountSettings />} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/social" element={<Social />} />
            <Route path="/chat/:userId" element={<Chat />} />
            <Route path="/channel/:channelId" element={<ChannelChat />} />
          </Routes>
        </Suspense>
      </Box>

      {/* 底部导航栏 */}
      <BottomNav />

      {/* 登录弹窗 */}
      <LoginModal
        open={loginOpen}
        onClose={handleCloseLogin}
        onSwitchToRegister={handleOpenRegister}
        onForgotPassword={() => setForgotOpen(true)}
      />

      {/* 注册弹窗 */}
      <RegisterModal
        open={registerOpen}
        onClose={handleCloseRegister}
        onSwitchToLogin={handleOpenLogin}
      />

      {/* 找回密码弹窗 */}
      <ForgotPasswordModal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        onSwitchToLogin={handleOpenLogin}
      />
    </Box>
  );
}

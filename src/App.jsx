import { useState, lazy, Suspense, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HexBackground from './components/HexBackground';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import AIChatBot from './components/AIChatBot';
import ForgotPasswordModal from './components/ForgotPasswordModal';

// 懒加载页面组件
const Home = lazy(() => import('./pages/Home'));
const Skills = lazy(() => import('./pages/Skills'));
const Agents = lazy(() => import('./pages/Agents'));
const ToolsDownload = lazy(() => import('./pages/ToolsDownload'));
const Games = lazy(() => import('./pages/Games'));
const AccountSettings = lazy(() => import('./pages/AccountSettings'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));
const Feedback = lazy(() => import('./pages/Feedback'));

// 判断是否为 App 环境（非网页）
const isNativeApp = typeof window !== 'undefined' && (
  window.Capacitor !== undefined || window.location.protocol === 'capacitor:'
);

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

/**
 * App 根组件
 * 管理全局状态（登录/注册弹窗）和路由
 * 从 AuthContext 获取登录状态
 */
export default function App() {
  const { user, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const navStack = useRef(['/']);      // 导航栈，初始为首页
  const isNavigating = useRef(false);  // 防止返回时重复触发

  // 追踪路由变化，维护导航栈（排除 pop/back 导致的变更）
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

  // 全面屏适配 + 返回手势控制
  useEffect(() => {
    const setupNative = async () => {
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        // 关键：不用 overlay 模式，状态栏独立渲染浅灰底+黑字
        StatusBar.setOverlaysWebView({ overlay: false });
        StatusBar.setBackgroundColor({ color: '#d0d0d0' });
        StatusBar.setStyle({ style: Style.Dark });
        // 获取状态栏高度，设为 CSS 变量
        const { height } = await StatusBar.getInfo();
        document.documentElement.style.setProperty('--status-bar-height', height + 'px');
      } catch {}

      // 返回手势：一级一级返回，首页时才最小化
      try {
        const { App: CapApp } = await import('@capacitor/app');
        CapApp.addListener('backButton', () => {
          const stack = navStack.current;
          if (stack.length > 1) {
            stack.pop();                    // 弹出当前页
            const prev = stack[stack.length - 1]; // 上一页
            isNavigating.current = true;
            navigate(prev, { replace: true });
          } else {
            CapApp.minimizeApp();           // 已在首页 → 回桌面
          }
        });
      } catch {}
    };
    setupNative();
  }, [navigate]);

  const handleOpenLogin = () => {
    setRegisterOpen(false);
    setLoginOpen(true);
  };

  const handleOpenRegister = () => {
    setLoginOpen(false);
    setRegisterOpen(true);
  };

  const handleCloseLogin = () => {
    setLoginOpen(false);
  };

  const handleCloseRegister = () => {
    setRegisterOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
      {/* 全站背景动画 */}
      <HexBackground />

      {/* 导航栏 — 传递 user、onLogout 和弹窗回调 */}
      <Navbar
        user={user}
        onLogout={logout}
        onLoginClick={handleOpenLogin}
        onRegisterClick={handleOpenRegister}
      />

      {/* 主内容区 */}
      <Box
        component="main"
        sx={{
          flex: 1,
          position: 'relative',
          zIndex: 1,
          ...(isNativeApp && { paddingTop: 'calc(56px + var(--status-bar-height, 0px))' }),
        }}
      >
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/tools" element={<ToolsDownload />} />
            {!isNativeApp && <Route path="/games" element={<Games />} />}
            <Route path="/settings" element={<AccountSettings />} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            <Route path="/feedback" element={<Feedback />} />
          </Routes>
        </Suspense>
      </Box>

      {/* 底部 */}
      <Footer />

      {/* AI 小助手浮窗 */}
      <AIChatBot />

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

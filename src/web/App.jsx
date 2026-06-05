import { useState, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../shared/contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HexBackground from '../shared/components/HexBackground';
import LoginModal from '../shared/components/LoginModal';
import RegisterModal from '../shared/components/RegisterModal';
import AIChatBot from '../shared/components/AIChatBot';
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
 * Web 端 App 根组件
 * 管理全局状态（登录/注册弹窗）和路由
 */
export default function App() {
  const { user, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

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
        }}
      >
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/skills" element={<Skills />} />
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

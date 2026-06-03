import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

/**
 * OAuth 回调页面
 * WeChat/QQ 登录成功后跳转到此页面，解析 token 并登录
 */
export default function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = params.get('token');
    const userStr = params.get('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        login(token, user);
      } catch (e) {
        console.error('OAuth callback parse error:', e);
      }
    }
    navigate('/', { replace: true });
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
      <CircularProgress sx={{ color: '#00D4FF' }} />
      <Typography sx={{ color: 'text.secondary' }}>正在登录...</Typography>
    </Box>
  );
}
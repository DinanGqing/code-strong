import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../shared/contexts/AuthContext';
import client from '../../shared/api/client';

/**
 * OAuth 回调页面
 * 处理两种模式：
 * 1. login — QQ 登录成功后跳转，解析 token 完成登录
 * 2. bind  — QQ 绑定成功后跳转，将 openid 绑定到当前用户
 */
export default function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const mode = params.get('mode');

    if (mode === 'bind') {
      // ====== 绑定模式 ======
      const openid = params.get('openid');
      const qqNickname = params.get('qq_nickname') || 'QQ用户';

      const doBind = async () => {
        try {
          const res = await client.post('/oauth/qq/bind', { openid, qq_nickname: qqNickname });
          if (res.code === 0) {
            // 绑定成功，存储一个 flag 通知账户设置页刷新
            localStorage.setItem('qq_bind_success', 'true');
          } else {
            localStorage.setItem('qq_bind_error', res.message || '绑定失败');
          }
        } catch {
          localStorage.setItem('qq_bind_error', '绑定失败，请重试');
        }
        navigate('/settings', { replace: true });
      };
      doBind();
      return;
    }

    // ====== 登录模式 ======
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
      navigate('/', { replace: true });
    } else {
      // 未绑定的 QQ 登录，跳转回首页
      navigate('/', { replace: true });
    }
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
      <CircularProgress sx={{ color: '#00D4FF' }} />
      <Typography sx={{ color: 'text.secondary' }}>{params.get('mode') === 'bind' ? '正在绑定 QQ...' : '正在登录...'}</Typography>
    </Box>
  );
}

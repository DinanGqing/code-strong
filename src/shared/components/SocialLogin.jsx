import { Box, Button, Typography, Divider } from '@mui/material';
import { useState } from 'react';
import client from '../api/client';

/**
 * QQ 登录按钮
 * 网页端：跳转系统浏览器完成 OAuth
 * App 端：跳转系统浏览器完成 OAuth
 * 注意：QQ 仅支持已绑定的用户登录，未绑定请先在「账户设置」中绑定
 */
export default function SocialLogin({ onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await client.get('/oauth/qq/url?mode=login');
      if (res.code !== 0) throw new Error(res.message);

      const authUrl = res.data.url;

      if (import.meta.env.VITE_PLATFORM === 'app') {
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url: authUrl });

        Browser.addListener('browserFinished', () => {
          const stored = localStorage.getItem('oauth_pending');
          if (stored) {
            const user = JSON.parse(stored);
            localStorage.removeItem('oauth_pending');
            onSuccess?.(user);
          }
        });
      } else {
        window.location.href = authUrl;
      }
    } catch (e) {
      console.error('QQ login error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Divider sx={{ my: 2 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>第三方登录</Typography>
      </Divider>

      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
        <Button variant="outlined" onClick={handleLogin} disabled={loading}
          sx={{ flex: 1, borderColor: '#12B7F5', color: '#12B7F5', fontWeight: 700, fontSize: '1.1rem',
            '&:hover': { borderColor: '#0D9ED9', bgcolor: 'rgba(18,183,245,0.08)' },
          }}>
          QQ 登录
        </Button>
      </Box>
    </Box>
  );
}

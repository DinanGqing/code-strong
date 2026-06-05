import { Box, Button, Typography, Divider } from '@mui/material';
import { useState } from 'react';
import client from '../api/client';

/**
 * 微信 / QQ 登录按钮组
 * 网页端：扫码登录
 * App 端：跳转系统浏览器完成 OAuth
 */
export default function SocialLogin({ onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleLogin = async (provider) => {
    setLoading(true);
    try {
      const { data } = await client.get(`/oauth/${provider}/url`);
      if (data.code !== 0) throw new Error(data.message);

      const authUrl = data.data.url;

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
      console.error(`${provider} login error:`, e);
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
        <Button variant="outlined" onClick={() => handleLogin('wechat')} disabled={loading}
          sx={{ flex: 1, borderColor: '#07C160', color: '#07C160', fontWeight: 700,
            '&:hover': { borderColor: '#06AD56', bgcolor: 'rgba(7,193,96,0.08)' },
          }}>
          {import.meta.env.VITE_PLATFORM === 'app' ? '微信登录' : '微信扫码'}
        </Button>

        <Button variant="outlined" onClick={() => handleLogin('qq')} disabled={loading}
          sx={{ flex: 1, borderColor: '#12B7F5', color: '#12B7F5', fontWeight: 700, fontSize: '1.1rem',
            '&:hover': { borderColor: '#0D9ED9', bgcolor: 'rgba(18,183,245,0.08)' },
          }}>
          {import.meta.env.VITE_PLATFORM === 'app' ? 'QQ 登录' : 'QQ 扫码'}
        </Button>
      </Box>
    </Box>
  );
}

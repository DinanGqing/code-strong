import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  IconButton,
  Snackbar,
  Alert,
  Link,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import InputAdornment from '@mui/material/InputAdornment';
import { useAuth } from '../contexts/AuthContext';

/**
 * 登录弹窗组件
 * 接入真实登录 API
 */
export default function LoginModal({ open, onClose, onSwitchToRegister, onForgotPassword }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setToast({ open: true, message: '请填写用户名和密码', severity: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const res = await login(username.trim(), password);
      if (res.code === 0) {
        setToast({ open: true, message: `欢迎回来，${username}！登录成功`, severity: 'success' });
        setTimeout(() => {
          onClose();
          setUsername('');
          setPassword('');
        }, 800);
      } else {
        setToast({ open: true, message: res.message || '登录失败', severity: 'error' });
      }
    } catch (_err) {
      setToast({ open: true, message: '网络错误，请稍后重试', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(18, 18, 42, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            <span className="gradient-text">登录</span>
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleLogin}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label="用户名 / 邮箱 / UID"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                  '&:hover fieldset': { borderColor: '#00B4D8' },
                  '&.Mui-focused fieldset': { borderColor: '#00D4FF' },
                },
              }}
            />
            <TextField
              label="密码"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                      sx={{ color: 'text.secondary' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                  '&:hover fieldset': { borderColor: '#00B4D8' },
                  '&.Mui-focused fieldset': { borderColor: '#00D4FF' },
                },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, flexDirection: 'column', gap: 1.5 }}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                background: loading
                  ? 'rgba(255,255,255,0.12)'
                  : 'linear-gradient(135deg, #00B4D8, #9B59B6)',
                '&:hover': {
                  background: loading
                    ? 'rgba(255,255,255,0.12)'
                    : 'linear-gradient(135deg, #00D4FF, #B07CD8)',
                },
                py: 1.2,
              }}
            >
              {loading ? '登录中...' : '登录'}
            </Button>
            <Link component="button" type="button"
              onClick={() => { onClose(); onForgotPassword?.(); }}
              sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', '&:hover': { color: '#00D4FF' } }}>
              忘记密码？
            </Link>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              还没有账号？{' '}
              <Link
                component="button"
                type="button"
                onClick={() => {
                  onClose();
                  onSwitchToRegister();
                }}
                sx={{
                  color: '#00D4FF',
                  '&:hover': { color: '#9B59B6' },
                }}
              >
                立即注册
              </Link>
            </Typography>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast({ ...toast, open: false })}
          variant="filled"
          sx={{ minWidth: 280 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
}

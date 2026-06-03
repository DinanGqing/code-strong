import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Typography, IconButton, Snackbar, Alert, Link, Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useAuth } from '../contexts/AuthContext';
import { sendCode } from '../api/auth';

export default function RegisterModal({ open, onClose, onSwitchToLogin }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    username: '', email: '', password: '', confirmPassword: '', code: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [regUid, setRegUid] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.username.trim()) newErrors.username = '请输入昵称';
    if (!form.email.trim()) newErrors.email = '请输入邮箱';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = '邮箱格式不正确';
    if (!form.password || form.password.length < 6) newErrors.password = '密码至少6位';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = '两次密码不一致';
    if (!form.code.trim() || form.code.length !== 6) newErrors.code = '请输入6位验证码';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendCode = async () => {
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setToast({ open: true, message: '请先输入有效的邮箱地址', severity: 'warning' });
      return;
    }
    setSending(true);
    try {
      const res = await sendCode(form.email.trim(), 'register');
      if (res.code === 0) {
        setToast({ open: true, message: res.message, severity: 'success' });
        let s = 60; setCountdown(s);
        const timer = setInterval(() => { s--; setCountdown(s); if (s <= 0) clearInterval(timer); }, 1000);
      } else {
        setToast({ open: true, message: res.message, severity: 'error' });
      }
    } catch {
      setToast({ open: true, message: '发送失败', severity: 'error' });
    } finally { setSending(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await register(form.username.trim(), form.email.trim(), form.password, form.code.trim());
      if (res.code === 0) {
        setRegUid(res.data?.user?.uid);
        setToast({ open: true, message: '注册成功！', severity: 'success' });
      } else {
        setToast({ open: true, message: res.message || '注册失败', severity: 'error' });
      }
    } catch {
      setToast({ open: true, message: '网络错误', severity: 'error' });
    } finally { setLoading(false); }
  };

  const handleClose = () => { resetForm(); setRegUid(null); onClose(); };

  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
      '&:hover fieldset': { borderColor: '#00B4D8' },
      '&.Mui-focused fieldset': { borderColor: '#00D4FF' },
    },
  };

  const resetForm = () => setForm({ username: '', email: '', password: '', confirmPassword: '', code: '' });

  // 注册成功后显示 UID
  if (regUid) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth
        PaperProps={{ sx: { background: 'rgba(18,18,42,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 } }}>
        <DialogTitle sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#00FF88' }}>🎉 注册成功！</Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          <Typography sx={{ color: 'text.secondary', mb: 1 }}>欢迎加入智码圈社区，{form.username}！</Typography>
          <Typography sx={{ color: 'text.secondary', mb: 2, fontSize: '0.85rem' }}>
            你的唯一身份标识（UID），可用于登录：
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
            <Typography sx={{
              fontSize: '1.8rem', fontWeight: 800, fontFamily: 'monospace',
              background: 'linear-gradient(135deg, #00D4FF, #00FF88)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>{regUid}</Typography>
            <IconButton size="small" onClick={() => { navigator.clipboard.writeText(String(regUid)); setToast({ open: true, message: 'UID 已复制', severity: 'success' }); }}>
              <ContentCopyIcon sx={{ fontSize: 16, color: '#00D4FF' }} />
            </IconButton>
          </Box>
          <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
            可用 昵称 / 邮箱 / UID 登录
          </Typography>
        </DialogContent>
        <DialogActions sx={{ pb: 3, justifyContent: 'center' }}>
          <Button onClick={handleClose} variant="contained"
            sx={{ background: 'linear-gradient(135deg, #00B4D8, #9B59B6)', px: 4 }}>
            好的
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth
        PaperProps={{ sx: { background: 'rgba(18,18,42,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}><span className="gradient-text">注册</span></Typography>
          <IconButton onClick={handleClose} size="small" sx={{ color: 'text.secondary' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <form onSubmit={handleRegister}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="昵称（可与其他用户相同）" fullWidth value={form.username} onChange={handleChange('username')}
              error={!!errors.username} helperText={errors.username} autoFocus InputLabelProps={{ shrink: true }} sx={textFieldSx} />
            <TextField label="邮箱" type="email" fullWidth value={form.email} onChange={handleChange('email')}
              error={!!errors.email} helperText={errors.email} InputLabelProps={{ shrink: true }} sx={textFieldSx} />
            <TextField label="密码" type="password" fullWidth value={form.password} onChange={handleChange('password')}
              error={!!errors.password} helperText={errors.password} InputLabelProps={{ shrink: true }} sx={textFieldSx} />
            <TextField label="确认密码" type="password" fullWidth value={form.confirmPassword} onChange={handleChange('confirmPassword')}
              error={!!errors.confirmPassword} helperText={errors.confirmPassword} InputLabelProps={{ shrink: true }} sx={textFieldSx} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField label="邮箱验证码" fullWidth value={form.code} onChange={handleChange('code')}
                error={!!errors.code} helperText={errors.code} inputProps={{ maxLength: 6 }}
                InputLabelProps={{ shrink: true }} sx={textFieldSx} />
              <Button variant="outlined" onClick={handleSendCode} disabled={sending || countdown > 0}
                sx={{ whiteSpace: 'nowrap', minWidth: 130, mt: 0.5, borderColor: 'rgba(0,180,216,0.4)', color: '#00D4FF',
                  '&:hover': { borderColor: '#00D4FF', background: 'rgba(0,212,255,0.08)' } }}>
                {countdown > 0 ? `${countdown}s` : sending ? '发送中' : '发送验证码'}
              </Button>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, flexDirection: 'column', gap: 1.5 }}>
            <Button type="submit" fullWidth variant="contained" size="large" disabled={loading}
              sx={{ background: loading ? 'rgba(255,255,255,0.12)' : 'linear-gradient(135deg, #00B4D8, #9B59B6)',
                '&:hover': { background: loading ? null : 'linear-gradient(135deg, #00D4FF, #B07CD8)' }, py: 1.2 }}>
              {loading ? '注册中...' : '注册'}
            </Button>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              已有账号？ <Link component="button" type="button" onClick={() => { onClose(); onSwitchToLogin(); }}
                sx={{ color: '#00D4FF', '&:hover': { color: '#9B59B6' } }}>立即登录</Link>
            </Typography>
          </DialogActions>
        </form>
      </Dialog>
      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ ...toast, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })} variant="filled" sx={{ minWidth: 280 }}>{toast.message}</Alert>
      </Snackbar>
    </>
  );
}

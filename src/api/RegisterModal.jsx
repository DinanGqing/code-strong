import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Typography, IconButton, Snackbar, Alert, Link, Box,
  ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import { useAuth } from '../contexts/AuthContext';
import { sendCode } from '../api/auth';

export default function RegisterModal({ open, onClose, onSwitchToLogin }) {
  const { register } = useAuth();
  const [registerType, setRegisterType] = useState('email');
  const [form, setForm] = useState({
    username: '', email: '', phone: '', password: '', confirmPassword: '', code: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
  };

  const handleTypeChange = (_, newType) => {
    if (newType) setRegisterType(newType);
  };

  const validate = () => {
    const newErrors = {};
    if (!form.username.trim()) newErrors.username = '请输入用户名';
    if (registerType === 'email') {
      if (!form.email.trim()) newErrors.email = '请输入邮箱';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = '邮箱格式不正确';
    } else {
      if (!form.phone.trim()) newErrors.phone = '请输入手机号';
      else if (!/^1[3-9]\d{9}$/.test(form.phone)) newErrors.phone = '请输入有效的手机号码';
    }
    if (!form.password || form.password.length < 6) newErrors.password = '密码至少6位';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = '两次密码不一致';
    if (!form.code.trim() || form.code.length !== 6) newErrors.code = '请输入6位验证码';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const target = registerType === 'email' ? form.email.trim() : form.phone.trim();
  const targetLabel = registerType === 'email' ? '邮箱' : '手机号';

  const handleSendCode = async () => {
    if (registerType === 'email') {
      if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        setToast({ open: true, message: '请先输入有效的邮箱地址', severity: 'warning' });
        return;
      }
    } else {
      if (!form.phone || !/^1[3-9]\d{9}$/.test(form.phone)) {
        setToast({ open: true, message: '请先输入有效的手机号码', severity: 'warning' });
        return;
      }
    }
    setSending(true);
    try {
      const res = await sendCode(target, 'register');
      if (res.code === 0) {
        setToast({ open: true, message: `验证码已发送至${targetLabel}`, severity: 'success' });
        let s = 60;
        setCountdown(s);
        const timer = setInterval(() => { s--; setCountdown(s); if (s <= 0) clearInterval(timer); }, 1000);
      } else {
        setToast({ open: true, message: res.message, severity: 'error' });
      }
    } catch {
      setToast({ open: true, message: '发送失败，请稍后重试', severity: 'error' });
    } finally {
      setSending(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await register(
        form.username.trim(),
        registerType === 'email' ? form.email.trim() : '',
        form.password,
        form.code.trim(),
        registerType === 'phone' ? form.phone.trim() : ''
      );
      if (res.code === 0) {
        setToast({ open: true, message: `注册成功！欢迎加入智码圈社区，${form.username}！`, severity: 'success' });
        setTimeout(() => { resetForm(); }, 1000);
      } else {
        setToast({ open: true, message: res.message || '注册失败', severity: 'error' });
      }
    } catch {
      setToast({ open: true, message: '网络错误，请稍后重试', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
      '&:hover fieldset': { borderColor: '#00B4D8' },
      '&.Mui-focused fieldset': { borderColor: '#00D4FF' },
    },
  };

  const resetForm = () => { setForm({ username: '', email: '', phone: '', password: '', confirmPassword: '', code: '' }); setErrors({}); onClose(); };

  return (
    <>
      <Dialog open={open} onClose={resetForm} maxWidth="xs" fullWidth
        PaperProps={{ sx: { background: 'rgba(18,18,42,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}><span className="gradient-text">注册</span></Typography>
          <IconButton onClick={resetForm} size="small" sx={{ color: 'text.secondary' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <form onSubmit={handleRegister}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="用户名" fullWidth value={form.username} onChange={handleChange('username')}
              error={!!errors.username} helperText={errors.username} autoFocus InputLabelProps={{ shrink: true }} sx={textFieldSx} />

            {/* 邮箱 / 手机号切换 */}
            <ToggleButtonGroup value={registerType} exclusive onChange={handleTypeChange} size="small"
              sx={{ '& .MuiToggleButton-root': { color: 'text.secondary', borderColor: 'rgba(255,255,255,0.12)', px: 2,
                '&.Mui-selected': { color: '#00D4FF', background: 'rgba(0,212,255,0.1)', borderColor: '#00B4D8' } } }}>
              <ToggleButton value="email"><EmailIcon sx={{ mr: 0.5, fontSize: 18 }} />邮箱注册</ToggleButton>
              <ToggleButton value="phone"><PhoneAndroidIcon sx={{ mr: 0.5, fontSize: 18 }} />手机号注册</ToggleButton>
            </ToggleButtonGroup>

            {registerType === 'email' ? (
              <TextField label="邮箱" type="email" fullWidth value={form.email} onChange={handleChange('email')}
                error={!!errors.email} helperText={errors.email} InputLabelProps={{ shrink: true }} sx={textFieldSx} />
            ) : (
              <TextField label="手机号" fullWidth value={form.phone} onChange={handleChange('phone')}
                error={!!errors.phone} helperText={errors.phone} inputProps={{ maxLength: 11 }}
                InputLabelProps={{ shrink: true }} sx={textFieldSx} />
            )}

            <TextField label="密码" type="password" fullWidth value={form.password} onChange={handleChange('password')}
              error={!!errors.password} helperText={errors.password} InputLabelProps={{ shrink: true }} sx={textFieldSx} />
            <TextField label="确认密码" type="password" fullWidth value={form.confirmPassword} onChange={handleChange('confirmPassword')}
              error={!!errors.confirmPassword} helperText={errors.confirmPassword} InputLabelProps={{ shrink: true }} sx={textFieldSx} />

            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField label="验证码" fullWidth value={form.code} onChange={handleChange('code')}
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
                '&:hover': { background: loading ? 'rgba(255,255,255,0.12)' : 'linear-gradient(135deg, #00D4FF, #B07CD8)' }, py: 1.2 }}>
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

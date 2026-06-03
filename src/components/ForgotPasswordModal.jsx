import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Typography, IconButton, Snackbar, Alert, Box, Stepper, Step, StepLabel,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { forgotPassword, resetPassword, sendCode } from '../api/auth';

const steps = ['验证邮箱', '重置密码'];

export default function ForgotPasswordModal({ open, onClose, onSwitchToLogin }) {
  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
      '&:hover fieldset': { borderColor: '#00B4D8' },
      '&.Mui-focused fieldset': { borderColor: '#00D4FF' },
    },
  };

  // Step 0: 发送验证码到邮箱
  const handleSendResetCode = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setToast({ open: true, message: '请输入有效的邮箱地址', severity: 'warning' });
      return;
    }
    setSending(true);
    try {
      const res = await forgotPassword(email.trim());
      if (res.code === 0) {
        setMaskedEmail(res.data?.maskedEmail || email);
        setToast({ open: true, message: res.message, severity: 'success' });
        let s = 60; setCountdown(s);
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

  const handleNext = () => {
    if (!code.trim() || code.length !== 6) {
      setErrors({ code: '请输入6位验证码' });
      return;
    }
    setActiveStep(1);
    setErrors({});
  };

  // Step 1: 重置密码
  const handleReset = async (e) => {
    e.preventDefault();
    const newErrs = {};
    if (!newPassword || newPassword.length < 6) newErrs.newPassword = '新密码至少6位';
    if (newPassword !== confirmPassword) newErrs.confirmPassword = '两次密码不一致';
    if (Object.keys(newErrs).length > 0) { setErrors(newErrs); return; }

    setLoading(true);
    try {
      const res = await resetPassword(email.trim(), code.trim(), newPassword);
      if (res.code === 0) {
        setToast({ open: true, message: '密码重置成功，请重新登录', severity: 'success' });
        setTimeout(() => { handleClose(); onSwitchToLogin(); }, 1500);
      } else {
        setToast({ open: true, message: res.message, severity: 'error' });
      }
    } catch {
      setToast({ open: true, message: '网络错误，请稍后重试', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => { setActiveStep(0); setEmail(''); setCode(''); setNewPassword(''); setConfirmPassword(''); setErrors({}); onClose(); };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth
        PaperProps={{ sx: { background: 'rgba(18,18,42,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}><span className="gradient-text">找回密码</span></Typography>
          <IconButton onClick={handleClose} size="small" sx={{ color: 'text.secondary' }}><CloseIcon /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (<Step key={label}><StepLabel>{label}</StepLabel></Step>))}
          </Stepper>

          {activeStep === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>请输入注册时使用的邮箱，我们将发送6位验证码。</Typography>
              <TextField label="注册邮箱" type="email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)}
                autoFocus InputLabelProps={{ shrink: true }} sx={textFieldSx} />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField label="验证码" fullWidth value={code} onChange={(e) => setCode(e.target.value)}
                  error={!!errors.code} helperText={errors.code} inputProps={{ maxLength: 6 }}
                  InputLabelProps={{ shrink: true }} sx={textFieldSx} />
                <Button variant="outlined" onClick={handleSendResetCode} disabled={sending || countdown > 0}
                  sx={{ whiteSpace: 'nowrap', minWidth: 120, mt: 0.5, borderColor: 'rgba(0,180,216,0.4)', color: '#00D4FF',
                    '&:hover': { borderColor: '#00D4FF' } }}>
                  {countdown > 0 ? `${countdown}s` : sending ? '发送中' : '发送验证码'}
                </Button>
              </Box>
              <Button fullWidth variant="contained" onClick={handleNext}
                sx={{ background: 'linear-gradient(135deg, #00B4D8, #9B59B6)', '&:hover': { background: 'linear-gradient(135deg, #00D4FF, #B07CD8)' }, py: 1.2 }}>
                下一步
              </Button>
            </Box>
          )}

          {activeStep === 1 && (
            <Box component="form" onSubmit={handleReset} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                正在为 <b style={{ color: '#00D4FF' }}>{maskedEmail}</b> 重置密码
              </Typography>
              <TextField label="新密码" type="password" fullWidth value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                error={!!errors.newPassword} helperText={errors.newPassword} autoFocus InputLabelProps={{ shrink: true }} sx={textFieldSx} />
              <TextField label="确认新密码" type="password" fullWidth value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                error={!!errors.confirmPassword} helperText={errors.confirmPassword} InputLabelProps={{ shrink: true }} sx={textFieldSx} />
              <Button type="submit" fullWidth variant="contained" disabled={loading}
                sx={{ background: loading ? 'rgba(255,255,255,0.12)' : 'linear-gradient(135deg, #00B4D8, #9B59B6)',
                  '&:hover': { background: loading ? 'rgba(255,255,255,0.12)' : 'linear-gradient(135deg, #00D4FF, #B07CD8)' }, py: 1.2 }}>
                {loading ? '重置中...' : '重置密码'}
              </Button>
              <Button onClick={() => setActiveStep(0)} sx={{ color: 'text.secondary' }}>返回上一步</Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ ...toast, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })} variant="filled" sx={{ minWidth: 280 }}>{toast.message}</Alert>
      </Snackbar>
    </>
  );
}

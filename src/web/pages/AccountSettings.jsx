import { useState, useEffect } from 'react';
import { Container, Box, Typography, TextField, Button, Avatar, Card, CardContent, Grid, Divider, Snackbar, Alert, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useAuth } from '../../shared/contexts/AuthContext';
import client from '../../shared/api/client';
import { sendCode } from '../../shared/api/auth';

const PRESET_AVATARS = [
  { emoji: '🤖', bg: 'linear-gradient(135deg, #00B4D8, #0077B6)' }, { emoji: '🦊', bg: 'linear-gradient(135deg, #FF6B35, #E74C3C)' }, { emoji: '🐱', bg: 'linear-gradient(135deg, #FFD700, #F39C12)' }, { emoji: '🐶', bg: 'linear-gradient(135deg, #9B59B6, #6C3483)' },
  { emoji: '🦄', bg: 'linear-gradient(135deg, #FF69B4, #E91E63)' }, { emoji: '🐼', bg: 'linear-gradient(135deg, #2C3E50, #1A252F)' }, { emoji: '🐸', bg: 'linear-gradient(135deg, #00FF88, #00B87A)' }, { emoji: '🦁', bg: 'linear-gradient(135deg, #FF9800, #E65100)' },
  { emoji: '🐰', bg: 'linear-gradient(135deg, #FF4081, #C2185B)' }, { emoji: '🐲', bg: 'linear-gradient(135deg, #E74C3C, #C0392B)' }, { emoji: '🦉', bg: 'linear-gradient(135deg, #795548, #4E342E)' }, { emoji: '🐳', bg: 'linear-gradient(135deg, #03A9F4, #01579B)' },
  { emoji: '🌸', bg: 'linear-gradient(135deg, #F48FB1, #AD1457)' }, { emoji: '⚡', bg: 'linear-gradient(135deg, #FFD700, #FF6D00)' }, { emoji: '🎮', bg: 'linear-gradient(135deg, #673AB7, #311B92)' }, { emoji: '🚀', bg: 'linear-gradient(135deg, #FF5722, #BF360C)' },
];

export default function AccountSettings() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', avatar: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const [emailChanged, setEmailChanged] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [stats, setStats] = useState({ activeDays: 0, recentLogs: [] });
  const [statsLoading, setStatsLoading] = useState(true);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [qqBound, setQqBound] = useState(false);
  const [qqLoading, setQqLoading] = useState(true);
  const [qqBindLoading, setQqBindLoading] = useState(false);

  useEffect(() => {
    if (user) { setForm({ username: user.username || '', email: user.email || '', avatar: user.avatar || '', bio: user.bio || '' }); }
    client.get('/auth/stats').then(res => { if (res.code === 0) setStats(res.data); }).finally(() => setStatsLoading(false));

    client.get('/oauth/qq/status').then(res => { if (res.code === 0) setQqBound(res.data.bound); }).finally(() => setQqLoading(false));

    const bindSuccess = localStorage.getItem('qq_bind_success');
    const bindError = localStorage.getItem('qq_bind_error');
    if (bindSuccess) {
      setToast({ open: true, message: 'QQ 绑定成功', severity: 'success' });
      setQqBound(true);
      localStorage.removeItem('qq_bind_success');
    }
    if (bindError) {
      setToast({ open: true, message: bindError, severity: 'error' });
      localStorage.removeItem('qq_bind_error');
    }
  }, [user]);

  const handleBindQQ = async () => {
    setQqBindLoading(true);
    try {
      const res = await client.get('/oauth/qq/url?mode=bind');
      if (res.code !== 0) throw new Error(res.message);
      if (import.meta.env.VITE_PLATFORM === 'app') {
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url: data.data.url });
      } else {
        window.location.href = data.data.url;
      }
    } catch (e) {
      setToast({ open: true, message: '获取 QQ 授权链接失败', severity: 'error' });
    } finally {
      setQqBindLoading(false);
    }
  };

  const handleUnbindQQ = async () => {
    try {
      const res = await client.post('/oauth/qq/unbind');
      if (res.code === 0) {
        setQqBound(false);
        setToast({ open: true, message: 'QQ 解绑成功', severity: 'success' });
      } else {
        setToast({ open: true, message: res.message || '解绑失败', severity: 'error' });
      }
    } catch {
      setToast({ open: true, message: '解绑失败', severity: 'error' });
    }
  };

  const isEmailDifferent = form.email.trim() !== (user?.email || '');

  const handleSave = async () => {
    if (isEmailDifferent && !verifyCode.trim()) { setToast({ open: true, message: '修改邮箱需要验证码', severity: 'warning' }); return; }
    setSaving(true);
    try {
      if (isEmailDifferent) { const res = await client.post('/auth/change-email', { newEmail: form.email.trim(), code: verifyCode.trim() }); if (res.code !== 0) { setToast({ open: true, message: res.message, severity: 'error' }); setSaving(false); return; } }
      const res = await client.put('/auth/profile', { username: form.username, avatar: form.avatar, bio: form.bio });
      if (res.code === 0) { updateUser({ ...res.data.user, email: isEmailDifferent ? form.email : user.email }); setToast({ open: true, message: '资料更新成功', severity: 'success' }); setEditing(false); setEmailChanged(false); setVerifyCode(''); }
      else { setToast({ open: true, message: res.message, severity: 'error' }); }
    } catch { setToast({ open: true, message: '保存失败', severity: 'error' }); }
    finally { setSaving(false); }
  };

  const handleSendVerify = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setToast({ open: true, message: '请输入有效的新邮箱', severity: 'warning' }); return; }
    setSending(true);
    try { const res = await sendCode(form.email.trim(), 'change-email'); setToast({ open: true, message: res.code === 0 ? '验证码已发送' : res.message, severity: res.code === 0 ? 'success' : 'error' }); if (res.code === 0) { let s = 60; setCountdown(s); const timer = setInterval(() => { s--; setCountdown(s); if (s <= 0) clearInterval(timer); }, 1000); } }
    catch { setToast({ open: true, message: '发送失败', severity: 'error' }); }
    finally { setSending(false); }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try { const res = await client.delete('/auth/account', { data: { confirmCode: deleteConfirmInput.trim() } }); if (res.code === 0) { setDeleteDialogOpen(false); setToast({ open: true, message: res.message, severity: 'success' }); setTimeout(() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/'; }, 1500); } else { setToast({ open: true, message: res.message, severity: 'error' }); } }
    catch { setToast({ open: true, message: '注销失败，请稍后再试', severity: 'error' }); }
    finally { setDeleting(false); }
  };

  const textFieldSx = { '& .MuiOutlinedInput-root': { background: 'rgba(255,255,255,0.03)', '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' }, '&:hover fieldset': { borderColor: '#00B4D8' }, '&.Mui-focused fieldset': { borderColor: '#00D4FF' } } };

  if (!user) { return <Container sx={{ py: 8, textAlign: 'center' }}><Typography color="text.secondary">请先登录</Typography></Container>; }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h4" className="section-title" sx={{ mb: 4 }}>账户设置</Typography>

      <Card className="glass-card" sx={{ mb: 4 }}><CardContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>基本信息</Typography>
          {!editing ? (<Button startIcon={<EditIcon />} onClick={() => setEditing(true)} sx={{ color: '#00D4FF' }}>编辑</Button>) : (
            <Box sx={{ display: 'flex', gap: 1 }}><Button onClick={() => { setEditing(false); setVerifyCode(''); }} sx={{ color: 'text.secondary' }}>取消</Button><Button startIcon={<SaveIcon />} onClick={handleSave} disabled={saving} variant="contained" sx={{ background: 'linear-gradient(135deg, #00B4D8, #9B59B6)' }}>{saving ? '保存中...' : '保存'}</Button></Box>
          )}
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Avatar src={form.avatar && form.avatar.startsWith('http') ? form.avatar : undefined} sx={{ width: 100, height: 100, bgcolor: '#00B4D8', fontSize: '2.5rem' }}>{form.avatar && !form.avatar.startsWith('http') ? form.avatar?.charAt(0) : form.username?.charAt(0)?.toUpperCase()}</Avatar>
            {editing && (<Box sx={{ width: '100%' }}><Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>选择头像</Typography><Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>{PRESET_AVATARS.map((a, i) => (<Box key={i} onClick={() => setForm({ ...form, avatar: a.emoji })} sx={{ width: 48, height: 48, borderRadius: '50%', background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', cursor: 'pointer', border: form.avatar === a.emoji ? '2px solid #00D4FF' : '2px solid transparent', transition: 'all 0.2s', '&:hover': { transform: 'scale(1.1)' } }}>{a.emoji}</Box>))}</Box></Box>)}
            <Typography variant="caption" sx={{ color: '#00D4FF', fontFamily: 'monospace' }}>UID: {user.uid || user.id}</Typography>
          </Grid>
          <Grid item xs={12} md={9}><Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="昵称" fullWidth value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} disabled={!editing} InputLabelProps={{ shrink: true }} sx={textFieldSx} />
            <TextField label="邮箱" fullWidth value={form.email} onChange={e => { setForm({ ...form, email: e.target.value.replace(/\s/g, '') }); setEmailChanged(true); }} disabled={!editing} InputLabelProps={{ shrink: true }} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} sx={textFieldSx} />
            {editing && isEmailDifferent && (<Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}><TextField label="新邮箱验证码" size="small" value={verifyCode} onChange={e => setVerifyCode(e.target.value)} inputProps={{ maxLength: 6 }} sx={{ flex: 1, ...textFieldSx }} /><Button variant="outlined" size="small" onClick={handleSendVerify} disabled={sending || countdown > 0} sx={{ minWidth: 110, mt: 0.5, whiteSpace: 'nowrap', borderColor: 'rgba(0,180,216,0.4)', color: '#00D4FF', '&:hover': { borderColor: '#00D4FF' } }}>{countdown > 0 ? `${countdown}s` : sending ? '发送中' : '发送验证码'}</Button></Box>)}
            <TextField label="个人签名" fullWidth multiline rows={2} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} disabled={!editing} placeholder="介绍一下自己..." InputLabelProps={{ shrink: true }} sx={textFieldSx} />
          </Box></Grid>
        </Grid>
      </CardContent></Card>

      <Card className="glass-card"><CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>账户统计</Typography>
          <CalendarTodayIcon sx={{ color: '#00D4FF', fontSize: 18 }} />
          <Typography variant="body2" sx={{ color: '#00D4FF', fontWeight: 600 }}>{statsLoading ? '...' : stats.activeDays} 天</Typography>
          <HistoryIcon sx={{ color: '#9B59B6', fontSize: 18 }} />
          <Typography variant="body2" sx={{ color: '#9B59B6', fontWeight: 600 }}>{statsLoading ? '...' : stats.recentLogs.length} 次登录</Typography>
        </Box>
        {!statsLoading && stats.recentLogs.length > 0 && (
          <TableContainer sx={{ background: 'transparent', maxHeight: 200, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: 2 } }}>
            <Table size="small" padding="none"><TableBody>{stats.recentLogs.map((log, i) => (<TableRow key={i}><TableCell sx={{ color: 'text.secondary', borderColor: 'rgba(255,255,255,0.04)', fontSize: '0.75rem', py: 0.3 }}>{log.time}</TableCell><TableCell sx={{ color: 'text.secondary', borderColor: 'rgba(255,255,255,0.04)', fontSize: '0.7rem', fontFamily: 'monospace', py: 0.3, textAlign: 'right' }}>{log.ip}</TableCell></TableRow>))}</TableBody></Table>
          </TableContainer>
        )}
      </CardContent></Card>

      {/* QQ 第三方账号绑定 */}
      <Card className="glass-card" sx={{ mt: 4, border: qqBound ? '1px solid rgba(0,212,255,0.2)' : '1px solid rgba(255,255,255,0.06)' }}><CardContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>第三方账号绑定</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {qqLoading ? '查询中...' : qqBound ? '已绑定 QQ 账号，可使用 QQ 快速登录' : '绑定 QQ 后，可使用 QQ 一键登录'}
            </Typography>
          </Box>
          <Box>
            {qqLoading ? (
              <CircularProgress size={24} sx={{ color: '#00D4FF' }} />
            ) : qqBound ? (
              <Button variant="outlined" onClick={handleUnbindQQ}
                sx={{ color: '#ff5252', borderColor: 'rgba(255,82,82,0.3)',
                  '&:hover': { borderColor: '#ff5252', background: 'rgba(255,82,82,0.08)' } }}>
                解绑 QQ
              </Button>
            ) : (
              <Button variant="contained" onClick={handleBindQQ} disabled={qqBindLoading}
                sx={{ background: qqBindLoading ? 'rgba(255,255,255,0.12)' : 'linear-gradient(135deg, #12B7F5, #0D9ED9)',
                  '&:hover': { background: 'linear-gradient(135deg, #00D4FF, #12B7F5)' } }}>
                {qqBindLoading ? '跳转中...' : '绑定 QQ'}
              </Button>
            )}
          </Box>
        </Box>
      </CardContent></Card>

      <Card className="glass-card" sx={{ mt: 4, border: '1px solid rgba(255,82,82,0.15)' }}><CardContent sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#ff5252', mb: 1 }}>危险区域</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>注销后将<strong>立即删除</strong>你的全部个人数据（昵称、邮箱、头像等），你的社区内容将转为匿名展示。此操作不可撤销。</Typography>
        <Button variant="outlined" onClick={() => setDeleteDialogOpen(true)} sx={{ color: '#ff5252', borderColor: 'rgba(255,82,82,0.3)', '&:hover': { borderColor: '#ff5252', background: 'rgba(255,82,82,0.08)' } }}>注销账号</Button>
      </CardContent></Card>

      <Dialog open={deleteDialogOpen} onClose={() => { if (!deleting) setDeleteDialogOpen(false); }} maxWidth="xs" fullWidth PaperProps={{ sx: { background: 'rgba(18,18,42,0.98)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,82,82,0.2)', borderRadius: 2 } }}>
        <DialogTitle sx={{ color: '#ff5252', fontWeight: 700 }}>确认注销账号</DialogTitle>
        <DialogContent sx={{ pt: 1 }}><Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>请输入你的昵称 <strong style={{ color: '#00D4FF' }}>{user.username}</strong> 以确认注销：</Typography>
          <TextField fullWidth autoFocus placeholder={`输入 "${user.username}" 确认`} value={deleteConfirmInput} onChange={(e) => setDeleteConfirmInput(e.target.value)} disabled={deleting} InputLabelProps={{ shrink: true }}
            sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255,255,255,0.03)', '& fieldset': { borderColor: 'rgba(255,82,82,0.3)' }, '&:hover fieldset': { borderColor: '#ff5252' }, '&.Mui-focused fieldset': { borderColor: '#ff5252' } } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => { setDeleteDialogOpen(false); setDeleteConfirmInput(''); }} disabled={deleting} sx={{ color: 'text.secondary' }}>取消</Button>
          <Button variant="contained" onClick={handleDeleteAccount} disabled={deleting || deleteConfirmInput.trim() !== user.username}
            sx={{ background: deleting ? 'rgba(255,82,82,0.3)' : 'linear-gradient(135deg, #ff5252, #d32f2f)', '&:hover': { background: 'linear-gradient(135deg, #ff1744, #b71c1c)' } }}>{deleting ? '注销中...' : '确认注销'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ ...toast, open: false })} anchorOrigin={{ vertical: 'center', horizontal: 'center' }}><Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })} variant="filled">{toast.message}</Alert></Snackbar>
    </Container>
  );
}

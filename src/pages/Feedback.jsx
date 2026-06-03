import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Card, CardContent, Typography, TextField, Button, Box,
  ToggleButtonGroup, ToggleButton, Snackbar, Alert, IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReportIcon from '@mui/icons-material/Report';
import FeedbackIcon from '@mui/icons-material/Feedback';
import BugReportIcon from '@mui/icons-material/BugReport';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import client from '../api/client';
import { useAuth } from '../contexts/AuthContext';

const TYPES = [
  { value: '举报', icon: <ReportIcon />, label: '举报' },
  { value: '建议', icon: <FeedbackIcon />, label: '建议' },
  { value: '问题反馈', icon: <BugReportIcon />, label: '问题' },
  { value: '其他', icon: <HelpOutlineIcon />, label: '其他' },
];

export default function Feedback() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [type, setType] = useState('问题反馈');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setToast({ open: true, message: '标题和描述不能为空', severity: 'warning' });
      return;
    }
    if (!user && !contact.trim()) {
      setToast({ open: true, message: '未登录用户请填写联系方式', severity: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await client.post('/feedback', { type, title: title.trim(), description: description.trim(), contact: contact.trim() });
      if (res.code === 0) {
        setToast({ open: true, message: res.message, severity: 'success' });
        setTitle(''); setDescription(''); setContact('');
      } else {
        setToast({ open: true, message: res.message, severity: 'error' });
      }
    } catch {
      setToast({ open: true, message: '提交失败，请稍后重试', severity: 'error' });
    } finally { setSubmitting(false); }
  };

  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      background: 'rgba(255,255,255,0.03)',
      '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
      '&:hover fieldset': { borderColor: '#00B4D8' },
      '&.Mui-focused fieldset': { borderColor: '#00D4FF' },
    },
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 1, md: 3 }, px: { xs: 1, md: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
        <IconButton onClick={() => navigate(-1)} size="small" sx={{ color: 'text.secondary', flexShrink: 0 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" className="section-title" sx={{ mb: 0, fontSize: { xs: '1.3rem', md: '1.5rem' } }}>用户反馈</Typography>
      </Box>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
        遇到问题？有建议？发现违规内容？请告诉我们。
      </Typography>

      <Card className="glass-card">
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, md: 3 } }}>
              {/* 反馈类型 */}
              <Box>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>反馈类型</Typography>
                <ToggleButtonGroup
                  value={type} exclusive
                  onChange={(_, v) => v && setType(v)}
                  size="small"
                  sx={{
                    '& .MuiToggleButton-root': {
                      color: 'text.secondary',
                      borderColor: 'rgba(255,255,255,0.12)',
                      textTransform: 'none',
                      '&.Mui-selected': { color: '#00D4FF', background: 'rgba(0,212,255,0.1)', borderColor: 'rgba(0,212,255,0.3)' },
                    },
                  }}
                >
                  {TYPES.map(t => (
                    <ToggleButton key={t.value} value={t.value} sx={{ display: 'flex', gap: 0.5 }}>
                      {t.icon} {t.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>

              <TextField label="标题" fullWidth required value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="简单描述问题或建议"
                InputLabelProps={{ shrink: true }} size="small" sx={textFieldSx} />

              <TextField label="详细描述" fullWidth required multiline rows={4}
                value={description} onChange={e => setDescription(e.target.value)}
                placeholder="描述问题或建议..."
                InputLabelProps={{ shrink: true }} size="small" sx={textFieldSx} />

              <TextField label={user ? '联系方式（选填）' : '联系方式（必填）'} fullWidth required={!user}
                value={contact} onChange={e => setContact(e.target.value)}
                placeholder="邮箱或QQ" size="small"
                InputLabelProps={{ shrink: true }} sx={textFieldSx} />

              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button variant="outlined" size="medium"
                  onClick={() => navigate(-1)}
                  sx={{ flex: 1, borderColor: 'rgba(255,255,255,0.2)', color: 'text.secondary', textTransform: 'none',
                    '&:hover': { borderColor: 'rgba(255,255,255,0.4)' } }}>
                  取消
                </Button>
                <Button type="submit" variant="contained" size="medium"
                  disabled={submitting || !title.trim() || !description.trim()}
                  sx={{ flex: 1, textTransform: 'none',
                    background: submitting ? 'rgba(255,255,255,0.12)' : 'linear-gradient(135deg, #00B4D8, #9B59B6)',
                    '&:hover': { background: 'linear-gradient(135deg, #00D4FF, #B07CD8)' },
                  }}>
                  {submitting ? '提交中...' : '提交反馈'}
                </Button>
              </Box>

              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
                也可直接发送邮件至 support@bitopen.online
              </Typography>
            </Box>
          </form>
        </CardContent>
      </Card>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ ...toast, open: false })} anchorOrigin={{ vertical: 'center', horizontal: 'center' }}
        sx={{ zIndex: 9999 }}>
        <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })} variant="filled">{toast.message}</Alert>
      </Snackbar>
    </Container>
  );
}

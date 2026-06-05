import { useState } from 'react';
import { Box, Typography, Link as MuiLink, Container, Fab } from '@mui/material';
import { Link } from 'react-router-dom';
import GetAppIcon from '@mui/icons-material/GetApp';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import QrCode2Icon from '@mui/icons-material/QrCode2';

const APP_VERSION = '1.1.5';
const APK_URL = `/download/zhimaquan-v${APP_VERSION}.apk`;

export default function Footer() {
  const year = new Date().getFullYear();
  const [downloadOpen, setDownloadOpen] = useState(false);

  return (
    <>
      {/* 右上角悬浮下载按钮 */}
      <Box sx={{ position: 'fixed', top: { xs: 72, md: 80 }, right: { xs: 12, md: 24 }, zIndex: 900 }}>
        <Fab variant="extended" size="small" onClick={() => setDownloadOpen(true)}
          sx={{
            color: '#00FF88', background: 'rgba(10,10,26,0.9)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(0,255,136,0.3)', boxShadow: '0 0 16px rgba(0,255,136,0.15)',
            transition: 'all 0.3s',
            '&:hover': { background: 'rgba(0,255,136,0.12)', borderColor: '#00FF88', transform: 'translateY(-2px)', boxShadow: '0 0 24px rgba(0,255,136,0.25)' },
          }}>
          <GetAppIcon sx={{ mr: 0.5, fontSize: 18 }} />
          下载App
        </Fab>
      </Box>

      {/* 下载弹窗 */}
      <Dialog open={downloadOpen} onClose={() => setDownloadOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { background: 'rgba(14,14,30,0.98)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#00D4FF' }}>下载 App</Typography>
          <IconButton onClick={() => setDownloadOpen(false)} size="small" sx={{ color: 'rgba(255,255,255,0.4)' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {/* 版本信息 */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 600, color: '#e0e0e0', fontSize: '1.1rem', mb: 0.5 }}>
              码坚强 v{APP_VERSION}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
              AI Agent 开发者社区 · Android 版
            </Typography>
          </Box>

          {/* 下载按钮 */}
          <Button
            variant="contained"
            fullWidth
            component="a"
            href={APK_URL}
            onClick={() => setTimeout(() => setDownloadOpen(false), 500)}
            startIcon={<GetAppIcon />}
            sx={{
              background: 'linear-gradient(135deg, #00B4D8, #9B59B6)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '1rem',
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': { background: 'linear-gradient(135deg, #00D4FF, #B07CD8)', boxShadow: '0 4px 20px rgba(0,180,216,0.4)' },
            }}
          >
            下载 zhimaquan-v{APP_VERSION}.apk
          </Button>

          <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem', textAlign: 'center' }}>
            下载后将直接安装，请确保已开启「允许安装未知来源应用」
          </Typography>
        </DialogContent>
      </Dialog>

      {/* 底部栏 */}
      <Box component="footer"
        sx={{
          mt: 'auto', py: 2,
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(10, 10, 26, 0.6)', backdropFilter: 'blur(12px)',
        }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.8 }}>
            <MuiLink href="https://workbuddy.cn" target="_blank" rel="noopener noreferrer" underline="none"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.9rem', fontWeight: 600, color: '#00D4FF', transition: 'all 0.3s', '&:hover': { color: '#9B59B6' } }}>
              🦾 技术支持：WorkBuddy
            </MuiLink>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>
                © {year} 码坚强
              </Typography>
              <MuiLink href="/privacy.html" underline="none"
                sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', '&:hover': { color: 'rgba(255,255,255,0.6)' } }}>隐私政策</MuiLink>
              <MuiLink component={Link} to="/feedback" underline="none"
                sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', '&:hover': { color: 'rgba(255,255,255,0.6)' } }}>用户反馈</MuiLink>
              <MuiLink href="https://beian.miit.gov.cn/#/Integrated/index" target="_blank" rel="noopener noreferrer" underline="none"
                sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', '&:hover': { color: 'rgba(255,255,255,0.6)' } }}>赣ICP备2025060250号-2</MuiLink>
              <MuiLink href="https://beian.mps.gov.cn/#/query/webSearch?code=36042802000211" target="_blank" rel="noopener noreferrer" underline="none"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.3, fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', '&:hover': { color: 'rgba(255,255,255,0.6)' } }}>
                <Box component="img" src="/beian-icon.png" alt="" sx={{ width: 12, height: 12 }} />赣公网安备36042802000211号</MuiLink>
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
}

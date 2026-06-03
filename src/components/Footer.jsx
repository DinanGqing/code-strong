import { Box, Typography, Link as MuiLink, Container, Fab } from '@mui/material';
import { Link } from 'react-router-dom';
import GetAppIcon from '@mui/icons-material/GetApp';

const isNativeApp = typeof window !== 'undefined' && (
  window.Capacitor !== undefined || window.location.protocol === 'capacitor:'
);

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <>
      {/* 右上角悬浮下载按钮（仅网页端） */}
      {!isNativeApp && (
        <Box sx={{ position: 'fixed', top: { xs: 72, md: 80 }, right: { xs: 12, md: 24 }, zIndex: 900 }}>
          <MuiLink href="/download/zhimaquan.apk" underline="none">
            <Fab variant="extended" size="small"
              sx={{
                color: '#00FF88', background: 'rgba(10,10,26,0.9)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(0,255,136,0.3)', boxShadow: '0 0 16px rgba(0,255,136,0.15)',
                transition: 'all 0.3s',
                '&:hover': { background: 'rgba(0,255,136,0.12)', borderColor: '#00FF88', transform: 'translateY(-2px)', boxShadow: '0 0 24px rgba(0,255,136,0.25)' },
              }}
            >
              <GetAppIcon sx={{ mr: 0.5, fontSize: 18 }} />
              下载App
            </Fab>
          </MuiLink>
        </Box>
      )}

      {/* 底部栏（仅网页端，APP 端收进「关于我们」弹窗） */}
      {!isNativeApp && (
        <Box component="footer"
          sx={{
            mt: 'auto', py: 2,
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(10, 10, 26, 0.6)', backdropFilter: 'blur(12px)',
          }}
        >
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
                  sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', '&:hover': { color: 'rgba(255,255,255,0.6)' } }}>
                  隐私政策
                </MuiLink>
                <MuiLink component={Link} to="/feedback" underline="none"
                  sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', '&:hover': { color: 'rgba(255,255,255,0.6)' } }}>
                  用户反馈
                </MuiLink>
                <MuiLink href="https://beian.miit.gov.cn/#/Integrated/index" target="_blank" rel="noopener noreferrer" underline="none"
                  sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', '&:hover': { color: 'rgba(255,255,255,0.6)' } }}>
                  赣ICP备2025060250号-2
                </MuiLink>
                <MuiLink href="https://beian.mps.gov.cn/#/query/webSearch?code=36042802000211" target="_blank" rel="noopener noreferrer" underline="none"
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.3, fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', '&:hover': { color: 'rgba(255,255,255,0.6)' } }}>
                  <Box component="img" src="/beian-icon.png" alt="" sx={{ width: 12, height: 12 }} />
                  赣公网安备36042802000211号
                </MuiLink>
              </Box>
            </Box>
          </Container>
        </Box>
      )}
    </>
  );
}

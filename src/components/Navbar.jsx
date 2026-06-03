import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Avatar,
  Typography,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton as MuiIconButton,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useNavigate } from 'react-router-dom';

const isNativeApp = typeof window !== 'undefined' && (
  window.Capacitor !== undefined || window.location.protocol === 'capacitor:'
);

const ALL_NAV_ITEMS = [
  { label: '首页', path: '/' },
  { label: '技能广场', path: '/skills' },
  { label: 'Agent 推荐', path: '/agents' },
  { label: '工具下载', path: '/tools' },
  { label: '小游戏', path: '/games', nativeOnly: false },
  { label: '关于我们', path: '/about', nativeOnly: true },
];

const NAV_ITEMS = ALL_NAV_ITEMS.filter(item => {
  if (item.nativeOnly === true) return isNativeApp;
  if (item.nativeOnly === false) return !isNativeApp;
  return true;
});

export default function Navbar({ user, onLogout, onLoginClick, onRegisterClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  const [aboutOpen, setAboutOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleAvatarClick = (e) => {
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    onLogout();
  };

  return (
    <>
      <AppBar
        position={isNativeApp ? 'fixed' : 'sticky'}
        sx={{
          background: 'rgba(10, 10, 26, 0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${'rgba(255, 255, 255, 0.06)'}`,
          zIndex: 10,
          ...(isNativeApp && { top: 0 }),
        }}
        elevation={0}
      >
        <Toolbar sx={{ px: { xs: 2, md: 8 }, py: { md: 0.5 }, paddingTop: 'var(--status-bar-height, 0px)' }}>
          {/* Logo — 提示符图标 + 品牌文字 */}
          <Box
            component={Link}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1.5, md: 2 },
              textDecoration: 'none',
              color: 'inherit',
              mr: { md: 4 },
            }}
          >
            {/* 提示符 V 字图标 */}
            <Box sx={{ flexShrink: 0 }}>
              <svg width="48" height="48" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 17 42 L 36 26 L 17 10" stroke={'#AFA9EC'} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
                <path d="M 36 26 L 17 42 L 36 58" stroke={'#AFA9EC'} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.45"/>
                <rect x="39" y="22" width="14" height="5" rx="2.5" fill={'#CECBF6'} opacity="0.9"/>
                <rect x="17" y="65" width="38" height="3" rx="1.5" fill={'#7F77DD'} opacity={0.35}/>
              </svg>
            </Box>

            {/* 品牌文字 */}
            <Box>
              <Typography
                sx={{
                  fontSize: { xs: '0.9rem', md: '1.15rem' },
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: '#fff',
                  lineHeight: 1.2,
                }}
              >
                {isNativeApp ? '智码圈' : '码坚强'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
                <Typography
                  component="span"
                  sx={{
                    fontSize: { xs: '0.72rem', md: '0.85rem' },
                    fontWeight: 800,
                    color: '#EEEDFE',
                    letterSpacing: '0.02em',
                    lineHeight: 1.3,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  }}
                >
                  CODE
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    fontSize: { xs: '0.72rem', md: '0.85rem' },
                    fontWeight: 800,
                    color: '#AFA9EC',
                    letterSpacing: '0.02em',
                    lineHeight: 1.3,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    ml: 0.75,
                  }}
                >
                  STRONG
                </Typography>
              </Box>
              <Typography
                sx={{
                  fontSize: '0.55rem',
                  color: 'rgba(255,255,255,0.35)',
                  letterSpacing: '0.06em',
                  lineHeight: 1.2,
                  display: { xs: 'none', sm: 'block' },
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  mt: 0.2,
                }}
              >
                AI AGENT DEVELOPER COMMUNITY
              </Typography>
              {/* 信号点 */}
              <Box
                sx={{
                  display: { xs: 'none', sm: 'flex' },
                  gap: 0.4,
                  mt: 0.3,
                }}
              >
                {['#534AB7', '#7F77DD', '#AFA9EC', '#CECBF6', '#D8D4F4', '#EEEDFE'].map((color, i) => (
                  <Box
                    key={i}
                    sx={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      bgcolor: color,
                      opacity: 0.9 - i * 0.15,
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>

          {/* 桌面端导航 — 靠左，紧跟 Logo */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.path);
                const isAbout = item.path === '/about';
                return (
                  <Button
                    key={item.path}
                    component={isAbout ? 'button' : Link}
                    to={isAbout ? undefined : item.path}
                    onClick={isAbout ? () => setAboutOpen(true) : undefined}
                    disableRipple
                    sx={{
                      color: active ? '#00D4FF' : 'rgba(255,255,255,0.6)',
                      fontWeight: active ? 700 : 500,
                      fontSize: '0.92rem',
                      letterSpacing: '0.02em',
                      px: 2.5,
                      py: 1.5,
                      position: 'relative',
                      textTransform: 'none',
                      transition: 'all 0.2s ease',
                      '&::after': active
                        ? {
                            content: '""',
                            position: 'absolute',
                            bottom: 8,
                            left: 12,
                            right: 12,
                            height: '2.5px',
                            background: 'linear-gradient(90deg, #00D4FF, #9B59B6)',
                            borderRadius: '2px',
                          }
                        : {},
                      '&:hover': {
                        color: '#00D4FF',
                        background: 'transparent',
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Box>
          )}

          {/* 右侧按钮 — 保持靠右 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
            {isMobile && (
              <IconButton
                color="inherit"
                onClick={() => setDrawerOpen(true)}
                sx={{ color: '#00D4FF' }}
              >
                <MenuIcon />
              </IconButton>
            )}

            {user ? (
              !isMobile && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton onClick={handleAvatarClick} size="small">
                    <Avatar
                      src={user.avatar?.startsWith('http') ? user.avatar : undefined}
                      alt={user.username}
                      sx={{ width: 34, height: 34, bgcolor: '#00B4D8', fontSize: '1rem' }}>
                      {user.avatar && !user.avatar.startsWith('http') ? user.avatar : user.username.charAt(0).toUpperCase()}
                    </Avatar>
                  </IconButton>
                  <Box sx={{ cursor: 'pointer' }} onClick={handleAvatarClick}>
                    <Typography variant="body2" sx={{ color: '#e0e0e0', fontWeight: 600, lineHeight: 1.2 }}>
                      {user.username}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#00D4FF', fontFamily: 'monospace', fontSize: '0.7rem' }}>
                      UID: {user.uid || user.id}
                    </Typography>
                  </Box>
                  <Menu
                    anchorEl={anchorEl}
                    open={menuOpen}
                    onClose={handleMenuClose}
                    PaperProps={{
                      sx: {
                        background: 'rgba(18, 18, 42, 0.95)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        mt: 1,
                        minWidth: 140,
                      },
                    }}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  >
                    <MenuItem disabled>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                        UID: {user.uid || user.id}
                      </Typography>
                    </MenuItem>
                    <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
                      <SettingsIcon sx={{ mr: 1, fontSize: 18 }} />
                      账户设置
                    </MenuItem>
                    <MenuItem onClick={handleLogout} sx={{ color: '#ff5252' }}>
                      <LogoutIcon sx={{ mr: 1, fontSize: 18 }} />
                      退出登录
                    </MenuItem>
                  </Menu>
                </Box>
              )
            ) : (
              !isMobile && (
                <>
                  <Button
                    variant="outlined"
                    onClick={onLoginClick}
                    sx={{
                      borderColor: 'rgba(0,180,216,0.5)',
                      color: '#00D4FF',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      textTransform: 'none',
                      letterSpacing: '0.02em',
                      '&:hover': {
                        borderColor: '#00D4FF',
                        background: 'rgba(0, 212, 255, 0.08)',
                      },
                    }}
                  >
                    登录
                  </Button>
                  <Button
                    variant="contained"
                    onClick={onRegisterClick}
                    sx={{
                      background: 'linear-gradient(135deg, #00B4D8, #9B59B6)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      textTransform: 'none',
                      letterSpacing: '0.02em',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #00D4FF, #B07CD8)',
                        boxShadow: '0 4px 20px rgba(0,180,216,0.4)',
                      },
                    }}
                  >
                    注册
                  </Button>
                </>
              )
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* 移动端抽屉菜单 */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            background: 'rgba(10, 10, 26, 0.95)',
            backdropFilter: 'blur(16px)',
            width: 250,
            borderLeft: `1px solid ${'rgba(255, 255, 255, 0.06)'}`,
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <svg width="36" height="36" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M 17 42 L 36 26 L 17 10" stroke={'#AFA9EC'} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
              <path d="M 36 26 L 17 42 L 36 58" stroke={'#AFA9EC'} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.45"/>
              <rect x="39" y="22" width="14" height="5" rx="2.5" fill={'#CECBF6'} opacity="0.9"/>
              <rect x="17" y="65" width="38" height="3" rx="1.5" fill={'#7F77DD'} opacity={0.35}/>
            </svg>
            <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
              {isNativeApp ? '智码圈' : '码坚强'}
            </Typography>
          </Box>

          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, px: 1 }}>
              <Avatar
                src={user.avatar?.startsWith('http') ? user.avatar : undefined}
                alt={user.username}
                sx={{ width: 36, height: 36, bgcolor: '#00B4D8', fontSize: '1.2rem' }}>
                {user.avatar && !user.avatar.startsWith('http') ? user.avatar : user.username.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user.username}
                </Typography>
                <Typography variant="caption" sx={{ color: '#00D4FF', fontFamily: 'monospace' }}>
                  UID: {user.uid || user.id}
                </Typography>
                {user.bio && (
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', display: 'block' }}>
                    {user.bio}
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          <List>
            {NAV_ITEMS.map((item) => {
              const isAbout = item.path === '/about';
              return (
              <ListItemButton
                key={item.path}
                component={isAbout ? 'div' : Link}
                to={isAbout ? undefined : item.path}
                onClick={() => { setDrawerOpen(false); if (isAbout) setAboutOpen(true); }}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  color: isActive(item.path) ? '#00D4FF' : 'text.secondary',
                  fontWeight: isActive(item.path) ? 700 : 500,
                  background: isActive(item.path)
                    ? 'rgba(0, 212, 255, 0.1)'
                    : 'transparent',
                  '&:hover': {
                    background: 'rgba(0, 212, 255, 0.08)',
                  },
                }}
              >
                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: isActive(item.path) ? 700 : 500, fontSize: '0.95rem' }} />
              </ListItemButton>
            );
            })}
          </List>

          <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {user ? (
              <>
                <Button variant="outlined" fullWidth startIcon={<SettingsIcon />}
                  onClick={() => { setDrawerOpen(false); navigate('/settings'); }}
                  sx={{ borderColor: 'rgba(0,180,216,0.4)', color: '#00D4FF' }}>
                  账户设置
                </Button>
                <Button variant="outlined" fullWidth color="error" startIcon={<LogoutIcon />}
                  onClick={() => { setDrawerOpen(false); onLogout(); }}>
                  退出登录
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    setDrawerOpen(false);
                    onLoginClick();
                  }}
                  sx={{
                    borderColor: '#00B4D8',
                    color: '#00D4FF',
                  }}
                >
                  登录
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => {
                    setDrawerOpen(false);
                    onRegisterClick();
                  }}
                  sx={{
                    background: 'linear-gradient(135deg, #00B4D8, #9B59B6)',
                  }}
                >
                  注册
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Drawer>

      {/* 关于我们弹窗 */}
      <Dialog
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        maxWidth="xs" fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(18,18,42,0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            <span className="gradient-text">关于我们</span>
          </Typography>
          <MuiIconButton onClick={() => setAboutOpen(false)} size="small" sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </MuiIconButton>
        </DialogTitle>
        <DialogContent sx={{ pb: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#00D4FF', mb: 0.5 }}>
                🦾 技术支持：WorkBuddy
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                WorkBuddy 是新一代 AI 桌面助手，为{isNativeApp ? '智码圈' : '码坚强'}社区提供全方位的技术支持。
              </Typography>
              <Button
                size="small"
                href="https://workbuddy.cn"
                target="_blank"
                sx={{ color: '#00D4FF', fontSize: '0.8rem', mt: 0.5, textTransform: 'none' }}
              >
                访问 WorkBuddy →
              </Button>
            </Box>

            <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.06)', pt: 2 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                © {new Date().getFullYear()} {isNativeApp ? '智码圈' : '码坚强'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5, flexWrap: 'wrap' }}>
                <Button size="small" onClick={() => { setAboutOpen(false); navigate('/feedback'); }}
                  sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'none', minWidth: 0 }}>
                  用户反馈
                </Button>
                <Button size="small" href="/privacy.html" target="_blank"
                  sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'none', minWidth: 0 }}>
                  隐私政策
                </Button>
                <Button size="small" href="https://beian.miit.gov.cn/#/Integrated/index" target="_blank"
                  sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'none', minWidth: 0 }}>
                  赣ICP备2025060250号-2
                </Button>
                <Button size="small" href="https://beian.mps.gov.cn/#/query/webSearch?code=36042802000211" target="_blank"
                  sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'none', minWidth: 0 }}>
                  <Box component="img" src="/beian-icon.png" alt="" sx={{ width: 12, height: 12, mr: 0.3 }} />
                  赣公网安备号
                </Button>
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}

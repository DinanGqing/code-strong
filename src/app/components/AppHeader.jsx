import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  List,
  ListItemButton,
  Link,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import QrCodeIcon from '@mui/icons-material/QrCode';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import UpdateIcon from '@mui/icons-material/SystemUpdateAlt';
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import client from '../../shared/api/client';
import MyQRCode from './MyQRCode';
import ScannerDialog from './ScannerDialog';
import { useThemeMode } from '../../shared/contexts/ThemeModeContext';

const APP_VERSION = '1.1.5';
const PRIVACY_URL = 'http://bitopen.online/privacy.html';
const DEFAULT_AVATAR = '/app/logo-default-avatar.png';

/**
 * APP 顶部 Header
 * 左侧：用户头像（点击→QQ风格侧滑抽屉），右侧：加号按钮（弹出菜单）
 */
export default function AppHeader({ user, onLoginClick, onRegisterClick, onLogout }) {
  const navigate = useNavigate();
  const { mode, toggleMode } = useThemeMode();
  const theme = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // "+" 弹出菜单
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  const handleOpenMenu = (e) => setAnchorEl(e.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  // 加好友弹窗
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [searchUid, setSearchUid] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchMsg, setSearchMsg] = useState('');

  // 创建频道弹窗
  const [channelOpen, setChannelOpen] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [channelDesc, setChannelDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [channelStatus, setChannelStatus] = useState('');

  // 我的二维码弹窗
  const [qrOpen, setQrOpen] = useState(false);

  // 扫一扫弹窗
  const [scanOpen, setScanOpen] = useState(false);

  // 关于我们弹窗
  const [aboutOpen, setAboutOpen] = useState(false);

  const hideDrawer = () => setDrawerOpen(false);

  // 扫一扫 — 打开摄像头扫描二维码加好友
  const handleScan = () => {
    handleCloseMenu();
    setScanOpen(true);
  };

  // 搜索 UID 加好友
  const handleSearchUser = async () => {
    if (!searchUid.trim()) return;
    setSearching(true);
    setSearchResult(null);
    setSearchMsg('');
    try {
      // client 拦截器已返回 response.data，所以 res = { code, data, message }
      const res = await client.get('/api/social/users/search', { params: { q: searchUid.trim() } });
      if (res.code === 0 && res.data && res.data.length > 0) {
        setSearchResult(res.data);
      } else if (res.code !== 0) {
        setSearchResult([]);
        setSearchMsg(res.message || '搜索失败');
      } else {
        setSearchResult([]);
        setSearchMsg('未找到相关用户');
      }
    } catch {
      setSearchResult([]);
      setSearchMsg('搜索失败，请重试');
    } finally {
      setSearching(false);
    }
  };

  // 发送好友申请
  const handleSendRequest = async (toUid) => {
    try {
      const res = await client.post('/api/social/friend/request', { to_uid: toUid });
      if (res.data?.code === 0) {
        setSearchMsg('好友申请已发送 ✓');
        setTimeout(() => {
          setAddFriendOpen(false);
          setSearchResult(null);
          setSearchUid('');
          setSearchMsg('');
        }, 1200);
      } else {
        setSearchMsg(res.data?.message || '发送失败');
      }
    } catch {
      setSearchMsg('发送失败，请重试');
    }
  };

  // 创建频道
  const handleCreateChannel = async () => {
    if (!channelName.trim()) return;
    setCreating(true);
    try {
      const res = await client.post('/api/social/channels', {
        name: channelName.trim(),
        description: channelDesc.trim(),
      });
      if (res.data?.code === 0) {
        setChannelStatus('频道创建成功');
        setChannelName('');
        setChannelDesc('');
        setTimeout(() => {
          setChannelOpen(false);
          navigate(`/channel/${res.data.data.id}`);
        }, 800);
      } else {
        setChannelStatus(res.data?.message || '创建失败');
      }
    } catch {
      setChannelStatus('创建失败，请重试');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      {/* 顶部栏 */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          paddingTop: 'calc(24px + var(--status-bar-height, 24px))',
          paddingBottom: '12px',
          background: mode === 'dark' ? '#0d0d2b' : '#ffffff',
          backdropFilter: 'blur(20px)',
          borderBottom: mode === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
        }}
      >
        {/* 左侧：用户头像 — 点击打开抽屉 */}
        <Avatar
          onClick={() => setDrawerOpen(true)}
          src={user?.avatar?.startsWith('http')
            ? user.avatar
            : DEFAULT_AVATAR
          }
          sx={{
            width: 36,
            height: 36,
            bgcolor: user ? 'transparent' : 'rgba(0,0,0,0.1)',
            fontSize: '0.95rem',
            cursor: 'pointer',
            '&:hover': { opacity: 0.8 },
          }}
        />

        {/* 右侧：加号按钮 — QQ 风格灰色十字架 */}
        <IconButton onClick={handleOpenMenu} sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)' }}>
          <AddIcon />
        </IconButton>
      </Box>

      {/* ========== QQ 风格侧滑抽屉 ========== */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={hideDrawer}
        PaperProps={{
          sx: {
            width: 280,
            background: mode === 'dark' ? '#0d0d2b' : '#ffffff',
            backdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(0,0,0,0.06)',
            pt: 'calc(24px + var(--status-bar-height, 24px))',
          },
        }}
      >
        {/* 用户信息区 — 左侧头像+文字，右侧二维码图标 */}
        <Box sx={{ px: 3, py: 3, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            {/* 左侧：头像 + 文字信息（用户名/UID/签名） */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', minWidth: 0 }}>
              <Avatar
                src={user?.avatar?.startsWith('http')
                  ? user.avatar
                  : DEFAULT_AVATAR
                }
                sx={{ width: 56, height: 56, bgcolor: 'transparent', fontSize: '1.4rem', flexShrink: 0 }}
              />
              <Box sx={{ minWidth: 0 }}>
                {user ? (
                  <>
                    <Typography sx={{
                      fontWeight: 700,
                      color: mode === 'dark' ? '#ffffff' : '#1a1a2e',
                      fontSize: '1.1rem', lineHeight: 1.3,
                    }}>
                      {user.username}
                    </Typography>
                    <Typography sx={{ color: '#00D4FF', fontFamily: 'monospace', fontSize: '0.75rem', mt: 0.3 }}>
                      UID: {user.uid || user.id}
                    </Typography>
                    {user.bio && (
                      <Typography
                        sx={{
                          color: mode === 'dark' ? 'rgba(255,255,255,0.45)' : 'rgba(26,26,46,0.45)',
                          fontSize: '0.8rem', mt: 0.5,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140,
                        }}
                      >
                        {user.bio}
                      </Typography>
                    )}
                  </>
                ) : (
                  <>
                    <Typography sx={{
                      fontWeight: 700,
                      color: mode === 'dark' ? '#ffffff' : '#1a1a2e',
                      fontSize: '1.1rem', lineHeight: 1.3,
                    }}>
                      智码圈
                    </Typography>
                    <Typography sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.45)' : 'rgba(26,26,46,0.45)', fontSize: '0.8rem', mt: 0.3 }}>
                      登录后享受完整功能
                    </Typography>
                  </>
                )}
              </Box>
            </Box>
            {/* 右侧：二维码图标 — 独立按钮，点击弹出二维码浮层 */}
            <IconButton
              onClick={() => setQrOpen(true)}
              sx={{
                color: '#00D4FF',
                mt: 0.5,
                width: 40,
                height: 40,
                background: 'rgba(0,212,255,0.1)',
                borderRadius: '10px',
                '&:hover': { background: 'rgba(0,212,255,0.2)' },
              }}
            >
              <QrCodeIcon sx={{ fontSize: 22 }} />
            </IconButton>
          </Box>
        </Box>

        {/* 菜单列表 */}
        <List sx={{ px: 1, pt: 1 }}>
          {user ? (
            <>
              <ListItemButton
                onClick={() => { hideDrawer(); navigate('/settings'); }}
                sx={{ borderRadius: 2, mb: 0.5, '&:hover': { background: 'rgba(0,212,255,0.08)' } }}
              >
                <ListItemIcon><SettingsIcon sx={{ color: '#00D4FF', fontSize: 22 }} /></ListItemIcon>
                <ListItemText primary="账户设置" primaryTypographyProps={{ fontWeight: 500, color: mode === 'dark' ? '#ffffff' : '#1a1a2e' }} />
              </ListItemButton>
              <ListItemButton
                onClick={() => { hideDrawer(); setAboutOpen(true); }}
                sx={{ borderRadius: 2, mb: 0.5, '&:hover': { background: 'rgba(0,212,255,0.08)' } }}
              >
                <ListItemIcon><InfoIcon sx={{ color: '#9B59B6', fontSize: 22 }} /></ListItemIcon>
                <ListItemText primary="关于我们" primaryTypographyProps={{ fontWeight: 500, color: mode === 'dark' ? '#ffffff' : '#1a1a2e' }} />
              </ListItemButton>
              <Divider sx={{ borderColor: 'rgba(0,0,0,0.06)', my: 1 }} />
              {/* 白天/夜晚模式切换 */}
              <ListItemButton
                onClick={() => { hideDrawer(); toggleMode(); }}
                sx={{ borderRadius: 2, mb: 0.5, '&:hover': { background: 'rgba(0,212,255,0.08)' } }}
              >
                <ListItemIcon>
                  {mode === 'dark'
                    ? <LightModeIcon sx={{ color: '#FFD700', fontSize: 22 }} />
                    : <DarkModeIcon sx={{ color: '#666680', fontSize: 22 }} />
                  }
                </ListItemIcon>
                <ListItemText
                  primary={mode === 'dark' ? '白天模式' : '夜晚模式'}
                  primaryTypographyProps={{ fontWeight: 500, color: mode === 'dark' ? '#ffffff' : '#1a1a2e' }}
                />
              </ListItemButton>
              <Divider sx={{ borderColor: 'rgba(0,0,0,0.06)', my: 1 }} />
              <ListItemButton
                onClick={() => { hideDrawer(); onLogout(); }}
                sx={{ borderRadius: 2, '&:hover': { background: 'rgba(255,82,82,0.08)' } }}
              >
                <ListItemIcon><LogoutIcon sx={{ color: '#ff5252', fontSize: 22 }} /></ListItemIcon>
                <ListItemText primary="退出登录" primaryTypographyProps={{ fontWeight: 500, color: '#ff5252' }} />
              </ListItemButton>
            </>
          ) : (
            <>
              <ListItemButton
                onClick={() => { hideDrawer(); onLoginClick(); }}
                sx={{ borderRadius: 2, mb: 0.5, '&:hover': { background: 'rgba(0,212,255,0.08)' } }}
              >
                <ListItemIcon><LoginIcon sx={{ color: '#00D4FF', fontSize: 22 }} /></ListItemIcon>
                <ListItemText primary="登录" primaryTypographyProps={{ fontWeight: 500, color: mode === 'dark' ? '#ffffff' : '#1a1a2e' }} />
              </ListItemButton>
              <ListItemButton
                onClick={() => { hideDrawer(); onRegisterClick(); }}
                sx={{ borderRadius: 2, mb: 0.5, '&:hover': { background: 'rgba(155,89,182,0.08)' } }}
              >
                <ListItemIcon><PersonAddAltIcon sx={{ color: '#9B59B6', fontSize: 22 }} /></ListItemIcon>
                <ListItemText primary="注册" primaryTypographyProps={{ fontWeight: 500, color: mode === 'dark' ? '#ffffff' : '#1a1a2e' }} />
              </ListItemButton>
              <Divider sx={{ borderColor: 'rgba(0,0,0,0.06)', my: 1 }} />
              <ListItemButton
                onClick={() => { hideDrawer(); setAboutOpen(true); }}
                sx={{ borderRadius: 2, '&:hover': { background: 'rgba(0,212,255,0.08)' } }}
              >
                <ListItemIcon><InfoIcon sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.45)' : 'rgba(26,26,46,0.45)', fontSize: 22 }} /></ListItemIcon>
                <ListItemText primary="关于我们" primaryTypographyProps={{ fontWeight: 500, color: mode === 'dark' ? 'rgba(255,255,255,0.65)' : 'rgba(26,26,46,0.65)' }} />
              </ListItemButton>
            </>
          )}
        </List>
      </Drawer>

      {/* "+" 弹出菜单 */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            background: mode === 'dark' ? '#0d0d2b' : '#ffffff',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(0,0,0,0.08)',
            mt: 1,
            minWidth: 180,
          },
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            handleCloseMenu();
            if (!user) { onLoginClick(); return; }
            setAddFriendOpen(true);
          }}
        >
          <ListItemIcon><PersonAddIcon sx={{ color: '#00D4FF', fontSize: 20 }} /></ListItemIcon>
          <ListItemText>加好友</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => { handleCloseMenu(); handleScan(); }}>
          <ListItemIcon><QrCodeScannerIcon sx={{ color: '#9B59B6', fontSize: 20 }} /></ListItemIcon>
          <ListItemText>扫一扫加好友</ListItemText>
        </MenuItem>
        {user && (
          <MenuItem onClick={() => { handleCloseMenu(); setQrOpen(true); }}>
            <ListItemIcon><QrCodeIcon sx={{ color: '#00FF88', fontSize: 20 }} /></ListItemIcon>
            <ListItemText>我的二维码</ListItemText>
          </MenuItem>
        )}
        <Divider sx={{ borderColor: 'rgba(0,0,0,0.06)' }} />
        <MenuItem
          onClick={() => {
            handleCloseMenu();
            if (!user) { onLoginClick(); return; }
            setChannelOpen(true);
          }}
        >
          <ListItemIcon><AddCircleIcon sx={{ color: '#FFD700', fontSize: 20 }} /></ListItemIcon>
          <ListItemText>创建频道</ListItemText>
        </MenuItem>
      </Menu>

      {/* 加好友弹窗 */}
      <Dialog open={addFriendOpen} onClose={() => setAddFriendOpen(false)} maxWidth={false}
        PaperProps={{ sx: { background: '#ffffff', backdropFilter: 'blur(16px)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3, minWidth: 380 } }}
      >
        <DialogTitle sx={{ color: '#1a1a2e', fontWeight: 700, pb: 1 }}>添加好友</DialogTitle>
        <DialogContent>
          <Typography variant="caption" sx={{ color: 'rgba(26,26,46,0.55)', mb: 1, display: 'block' }}>输入用户 UID 或用户名搜索</Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField fullWidth size="small" value={searchUid}
              onChange={(e) => setSearchUid(e.target.value)}
              placeholder="输入 UID 或用户名"
              onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
              sx={{ '& .MuiOutlinedInput-root': { color: '#1a1a2e', '& fieldset': { borderColor: 'rgba(0,180,216,0.4)' }, '&:hover fieldset': { borderColor: '#00B4D8' } } }}
            />
            <Button variant="contained" onClick={handleSearchUser} disabled={searching}
              sx={{ background: 'linear-gradient(135deg, #00B4D8, #9B59B6)', textTransform: 'none', flexShrink: 0 }}>
              {searching ? <CircularProgress size={18} sx={{ color: '#1a1a2e' }} /> : '搜索'}
            </Button>
          </Box>
          {searchResult && searchResult.map((u) => (
            <Box key={u.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', mb: 1 }}>
              <Avatar src={u.avatar?.startsWith('http') ? u.avatar : DEFAULT_AVATAR} sx={{ width: 36, height: 36, bgcolor: 'transparent', fontSize: '0.85rem' }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{u.username}</Typography>
                <Typography variant="caption" sx={{ color: '#00D4FF', fontFamily: 'monospace' }}>UID: {u.uid}</Typography>
              </Box>
              <Button size="small" onClick={() => handleSendRequest(u.uid)}
                sx={{ color: '#00D4FF', borderColor: 'rgba(0,212,255,0.4)', textTransform: 'none' }} variant="outlined">
                加好友
              </Button>
            </Box>
          ))}

          {/* 搜索状态/消息 — 内联显示，不用顶部提示 */}
          {searchMsg && (
            <Typography sx={{
              textAlign: 'center',
              color: searchMsg.includes('✓')
                ? '#00FF88'
                : searchMsg.includes('失败')
                  ? '#ff5252'
                  : 'rgba(26,26,46,0.55)',
              fontSize: '0.85rem',
              py: 1.5,
            }}>
              {searchMsg}
            </Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* 创建频道弹窗 */}
      <Dialog open={channelOpen} onClose={() => setChannelOpen(false)} maxWidth={false}
        PaperProps={{ sx: { background: '#ffffff', backdropFilter: 'blur(16px)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3, minWidth: 380 } }}>
        <DialogTitle sx={{ color: '#1a1a2e', fontWeight: 700, pb: 1 }}>创建频道</DialogTitle>
        <DialogContent>
          <TextField fullWidth size="small" label="频道名称" value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            sx={{ mb: 2, '& .MuiInputLabel-root': { color: 'rgba(26,26,46,0.55)' }, '& .MuiOutlinedInput-root': { color: '#1a1a2e', '& fieldset': { borderColor: 'rgba(0,180,216,0.4)' } } }} />
          <TextField fullWidth size="small" label="频道描述（可选）" value={channelDesc}
            onChange={(e) => setChannelDesc(e.target.value)} multiline rows={2}
            sx={{ mb: 2, '& .MuiInputLabel-root': { color: 'rgba(26,26,46,0.55)' }, '& .MuiOutlinedInput-root': { color: '#1a1a2e', '& fieldset': { borderColor: 'rgba(0,180,216,0.4)' } } }} />
          <Button fullWidth variant="contained" onClick={handleCreateChannel} disabled={creating || !channelName.trim()}
            sx={{ background: 'linear-gradient(135deg, #00B4D8, #9B59B6)', textTransform: 'none', py: 1 }}>
            {creating ? <CircularProgress size={20} sx={{ color: '#1a1a2e' }} /> : '创建'}
          </Button>
        </DialogContent>
      </Dialog>

      {/* 扫一扫弹窗 */}
      <ScannerDialog open={scanOpen} onClose={() => setScanOpen(false)} />

      {/* 我的二维码弹窗 */}
      <MyQRCode open={qrOpen} onClose={() => setQrOpen(false)} />

      {/* 关于我们弹窗 */}
      <Dialog
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        maxWidth="xs"
        PaperProps={{
          sx: {
            background: mode === 'dark' ? '#0d0d2b' : '#ffffff',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 3,
            minWidth: 300,
          },
        }}
      >
        <DialogTitle sx={{ color: mode === 'dark' ? '#ffffff' : '#1a1a2e', fontWeight: 700, pb: 1, textAlign: 'center' }}>
          关于智码圈
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 3 }}>
          {/* Logo 或名称 */}
          <Box sx={{ mb: 2 }}>
            <Avatar
              src={DEFAULT_AVATAR}
              sx={{
                width: 64, height: 64, mx: 'auto', mb: 1.5,
                bgcolor: 'transparent',
              }}
            />
            <Typography sx={{ color: mode === 'dark' ? '#ffffff' : '#1a1a2e', fontWeight: 600, fontSize: '1.1rem' }}>
              智码圈
            </Typography>
          </Box>

          {/* 版本号 */}
          <Box
            sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
              bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              borderRadius: 2, py: 1.5, px: 2, mb: 2,
            }}
          >
            <Typography sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.55)' : 'rgba(26,26,46,0.55)', fontSize: '0.85rem' }}>
              版本
            </Typography>
            <Typography sx={{ color: '#00D4FF', fontFamily: 'monospace', fontWeight: 600, fontSize: '0.9rem' }}>
              v{APP_VERSION}
            </Typography>
          </Box>

          {/* 检查更新 */}
          <Button
            fullWidth
            variant="outlined"
            startIcon={<UpdateIcon />}
            onClick={() => {
              setAboutOpen(false);
              // 预留：跳转更新页面或检查更新 API
            }}
            sx={{
              mb: 1.5,
              borderColor: 'rgba(0,212,255,0.3)',
              color: '#00D4FF',
              textTransform: 'none',
              borderRadius: 2,
              py: 1,
              '&:hover': { borderColor: '#00D4FF', background: 'rgba(0,212,255,0.08)' },
            }}
          >
            检查更新
          </Button>

          {/* 隐私政策 */}
          <Link
            href={PRIVACY_URL}
            target="_blank"
            rel="noopener"
            underline="none"
            sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5,
              color: mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(26,26,46,0.4)',
              fontSize: '0.8rem',
              '&:hover': { color: '#00D4FF' },
            }}
          >
            <PrivacyTipIcon sx={{ fontSize: 16 }} />
            隐私政策
          </Link>
        </DialogContent>
      </Dialog>
    </>
  );
}

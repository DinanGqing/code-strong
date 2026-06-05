import { useEffect, useState } from 'react';
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Avatar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../shared/contexts/AuthContext';

/**
 * QQ 风格二维码展示页
 * 居中卡片，顶部返回+标题，中间正方形二维码+头像+名字，底部优雅提示文字
 */
export default function MyQRCode({ open, onClose }) {
  const { user } = useAuth();
  const [qrData, setQrData] = useState('');

  useEffect(() => {
    if (!open || !user) return;
    setQrData(`zhimaquan://user/${user.uid || user.id}`);
  }, [open, user]);

  return (
    <>
      {/* 半透明遮罩 — 点击关闭 */}
      <Box
        onClick={onClose}
        sx={{
          display: open ? 'block' : 'none',
          position: 'fixed', inset: 0, zIndex: 1299,
          background: 'rgba(0,0,0,0.6)',
        }}
      />

      {/* 二维码浮层卡片 — 点击内部不关闭 */}
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xs"
        PaperProps={{
          sx: {
            m: 0,
            borderRadius: 3,
            background: '#ffffff',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            overflow: 'visible',
            width: '82%',
            maxWidth: 340,
          },
        }}
      >
        {/* 顶部返回栏 */}
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, pt: 2, pb: 1 }}>
          <IconButton onClick={onClose} sx={{ color: '#1a1a2e', mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography sx={{ fontWeight: 600, color: '#1a1a2e', fontSize: '1rem' }}>
            我的二维码
          </Typography>
        </Box>

        {/* 内容区 — 垂直居中排列 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', px: 4, pb: 3 }}>
          {/* 二维码 — 使用 qrcode.react 确保稳定渲染 */}
          {qrData && (
            <Box
              sx={{
                width: 240, height: 240,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 2.5, bgcolor: '#1a1a2e', mb: 2,
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                flexShrink: 0,
              }}
            >
              <QRCodeSVG
                value={qrData}
                size={200}
                level="M"
                bgColor="#ffffff"
                fgColor="#0a0a1a"
                style={{ borderRadius: 4, display: 'block' }}
              />
            </Box>
          )}

          {user && (
            <>
              {/* 用户头像 + 名字 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Avatar
                  src={user.avatar?.startsWith('http') ? user.avatar : '/app/logo-default-avatar.png'}
                  sx={{ width: 28, height: 28, bgcolor: 'transparent', fontSize: '0.8rem' }}
                />
                <Typography sx={{ color: 'rgba(26,26,46,0.85)', fontWeight: 500, fontSize: '0.85rem' }}>
                  {user.username}
                </Typography>
              </Box>

              {/* 底部说明文字 — 更小更优雅 */}
              <Typography
                sx={{
                  color: 'rgba(26,26,46,0.35)',
                  fontSize: '0.65rem',
                  letterSpacing: '0.3px',
                  textAlign: 'center',
                  fontFamily: '"PingFang SC", "Noto Sans SC", system-ui, -apple-system, sans-serif',
                }}
              >
                扫一扫上面的二维码，加我为好友
              </Typography>
            </>
          )}
        </Box>
      </Dialog>
    </>
  );
}

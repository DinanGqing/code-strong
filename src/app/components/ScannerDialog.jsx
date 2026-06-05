import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Html5Qrcode } from 'html5-qrcode';
import client from '../../shared/api/client';

/**
 * 扫一扫弹窗 — QQ 风格全屏扫码
 * 全屏摄像头取景，无方框角标，左上角浮动返回按钮
 */
export default function ScannerDialog({ open, onClose }) {
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!open) {
      if (scannerRef.current) {
        try { scannerRef.current.stop(); } catch { /* ignore */ }
        scannerRef.current = null;
      }
      setScanning(false);
      setStatus('');
      return;
    }

    const startScanner = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(t => t.stop());
      } catch (e) {
        setStatus('无法访问摄像头，请授予相机权限');
        return;
      }

      try {
        scannerRef.current = new Html5Qrcode('qr-scanner-area');

        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
          setStatus('未检测到摄像头');
          return;
        }

        // 优先使用后置摄像头
        const backCamera = cameras.find(c =>
          c.label.toLowerCase().includes('back') ||
          c.label.toLowerCase().includes('后置') ||
          c.label.toLowerCase().includes('rear')
        ) || cameras[cameras.length - 1];

        setScanning(true);
        setStatus('');

        // 全屏扫描，不限制 qrbox
        await scannerRef.current.start(
          backCamera.id,
          { fps: 15 },
          async (decodedText) => {
            try { scannerRef.current?.stop(); } catch { /* ignore */ }
            setScanning(false);
            setStatus('已识别，正在处理...');

            const match = decodedText.match(/zhimaquan:\/\/user\/(\S+)/);
            if (!match) {
              setStatus('无效的二维码');
              setTimeout(() => { setStatus(''); onClose(); }, 1500);
              return;
            }

            const uid = match[1];
            try {
              const res = await client.post('/api/social/friend/request', { to_uid: uid });
              if (res.data?.code === 0) {
                setStatus('好友申请已发送！');
              } else {
                setStatus(res.data?.message || '添加失败');
              }
            } catch {
              setStatus('网络错误，请重试');
            }

            setTimeout(() => { setStatus(''); onClose(); }, 2000);
          },
          () => { /* 持续扫描中 */ },
        );
      } catch (err) {
        setStatus('摄像头启动失败');
        console.error('QR scanner error:', err);
      }
    };

    startScanner();

    const onBack = (e) => { e.preventDefault(); onClose(); };
    window.addEventListener('backbutton', onBack);

    return () => {
      window.removeEventListener('backbutton', onBack);
      if (scannerRef.current) {
        try { scannerRef.current.stop(); } catch { /* ignore */ }
        scannerRef.current = null;
      }
    };
  }, [open, onClose]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: { background: '#000', position: 'relative' },
      }}
    >
      {/* 摄像头全屏预览 */}
      <Box
        id="qr-scanner-area"
        sx={{
          flex: 1,
          width: '100%',
          height: '100%',
          bgcolor: '#000',
          '& video': {
            objectFit: 'cover !important',
          },
        }}
      />

      {/* 左上角浮动返回按钮 — QQ 风格 */}
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          top: 'calc(12px + var(--status-bar-height, 24px))',
          left: 12,
          zIndex: 10,
          color: '#fff',
          bgcolor: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(4px)',
          width: 36,
          height: 36,
          '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' },
        }}
      >
        <ArrowBackIcon />
      </IconButton>

      {/* 底部状态提示 */}
      <Box
        sx={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
          textAlign: 'center',
          pb: 'calc(40px + env(safe-area-inset-bottom, 16px))',
          pt: 2,
        }}
      >
        {scanning && (
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
            对准二维码
          </Typography>
        )}
        {!scanning && status && (
          <Typography sx={{
            color: status.includes('失败') || status.includes('无效') || status.includes('无法')
              ? '#ff5252' : '#00FF88',
            fontSize: '0.9rem',
          }}>
            {status}
          </Typography>
        )}
      </Box>
    </Dialog>
  );
}

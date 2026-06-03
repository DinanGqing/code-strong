import { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Tooltip } from '@mui/material';
import roomBg from '../assets/pixel-room.png';
import lobsterSheet from '../assets/lobster-sheet.png';

const FRAMES = 4;
const FRAME_MS = [3000, 2000, 1500, 1500]; // 各帧持续时间
const BUBBLE_TEXTS = [
  '你好！我是智码圈的像素助手🦞',
  '有什么可以帮你的？',
  '点我聊天吧！',
  '今天代码写了吗？',
  '💪 智码圈！',
];

/**
 * 像素宠物组件 — 可拖动的像素房间+龙虾
 * @param {Function} onClick - 点击龙虾回调
 */
export default function PixelPet({ onClick }) {
  const containerRef = useRef(null);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem('pixelpet_pos');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { x: window.innerWidth - 240, y: window.innerHeight - 280 };
  });
  const [frame, setFrame] = useState(0);
  const [bubble, setBubble] = useState({ show: false, text: '' });
  const [hovering, setHovering] = useState(false);
  const frameTimer = useRef(null);
  const bubbleTimer = useRef(null);

  // 帧自动循环
  const advanceFrame = useCallback(() => {
    setFrame((f) => (f < FRAMES - 1 ? f + 1 : 0));
  }, []);

  useEffect(() => {
    const cycle = () => {
      advanceFrame();
      const delay = FRAME_MS[frame] || 2000;
      frameTimer.current = setTimeout(cycle, delay);
    };
    frameTimer.current = setTimeout(cycle, FRAME_MS[0]);
    return () => clearTimeout(frameTimer.current);
  }, [advanceFrame, frame]);

  // 对话气泡定时弹出
  useEffect(() => {
    const showBubble = () => {
      const text = BUBBLE_TEXTS[Math.floor(Math.random() * BUBBLE_TEXTS.length)];
      setBubble({ show: true, text });
      setTimeout(() => setBubble({ show: false, text: '' }), 3500);
      bubbleTimer.current = setTimeout(showBubble, 8000 + Math.random() * 5000);
    };
    bubbleTimer.current = setTimeout(showBubble, 3000);
    return () => clearTimeout(bubbleTimer.current);
  }, []);

  // 拖动
  const handleMouseDown = (e) => {
    if (e.target.dataset.drag === 'false') return;
    e.preventDefault();
    dragging.current = true;
    offset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleTouchStart = (e) => {
    if (e.target.dataset.drag === 'false') return;
    const t = e.touches[0];
    dragging.current = true;
    offset.current = {
      x: t.clientX - position.x,
      y: t.clientY - position.y,
    };
  };

  useEffect(() => {
    const move = (e) => {
      if (!dragging.current) return;
      const cx = e.clientX ?? e.touches[0]?.clientX;
      const cy = e.clientY ?? e.touches[0]?.clientY;
      if (cx == null || cy == null) return;
      const nx = cx - offset.current.x;
      const ny = cy - offset.current.y;
      setPosition({ x: nx, y: ny });
    };

    const up = () => {
      if (dragging.current) {
        dragging.current = false;
        setPosition((p) => {
          try { localStorage.setItem('pixelpet_pos', JSON.stringify(p)); } catch {}
          return p;
        });
      }
    };

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, []);

  // 龙虾帧 CSS 偏移
  const frameCol = frame % 2;
  const frameRow = Math.floor(frame / 2);
  const lobsterStyle = {
    objectPosition: `${-frameCol * 100}% ${-frameRow * 100}%`,
    objectFit: 'none',
    transform: hovering ? 'scale(1.08)' : 'scale(1)',
    transition: 'transform 0.2s ease',
  };

  return (
    <Box
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      sx={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9997,
        cursor: 'grab',
        userSelect: 'none',
        filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.5))',
        transition: dragging.current ? 'none' : 'filter 0.3s',
        '&:active': { cursor: 'grabbing' },
        '&:hover': {
          filter: 'drop-shadow(0 8px 40px rgba(0,212,255,0.3))',
        },
      }}
    >
      {/* 拖动把手 */}
      <Box
        sx={{
          height: 28,
          background: 'rgba(10,10,26,0.8)',
          backdropFilter: 'blur(8px)',
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          border: '1px solid rgba(255,255,255,0.08)',
          borderBottom: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.5,
        }}
      >
        <Box sx={{ width: 24, height: 2, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.3)' }} />
        <Box sx={{ width: 24, height: 2, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.2)' }} />
      </Box>

      {/* 房间场景 */}
      <Box
        sx={{
          position: 'relative',
          width: 200,
          height: 180,
          border: '1px solid rgba(255,255,255,0.08)',
          borderTop: 'none',
          borderBottomLeftRadius: 10,
          borderBottomRightRadius: 10,
          overflow: 'hidden',
          background: '#0a0a1a',
        }}
      >
        {/* 房间背景 */}
        <Box
          component="img"
          src={roomBg}
          alt=""
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            imageRendering: 'pixelated',
            opacity: 0.85,
          }}
        />

        {/* 龙虾角色 */}
        <Tooltip title="点击和我聊天！" placement="top" arrow>
          <Box
            component="img"
            src={lobsterSheet}
            alt="龙虾助手"
            data-drag="false"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
              setFrame(3); // 挥手帧
              setTimeout(() => setFrame(0), 1500);
            }}
            onMouseEnter={() => { setHovering(true); setFrame(3); }}
            onMouseLeave={() => { setHovering(false); setFrame(0); }}
            sx={{
              position: 'absolute',
              bottom: 28,
              right: 24,
              width: 72,
              height: 72,
              imageRendering: 'pixelated',
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))',
              cursor: 'pointer',
              zIndex: 2,
              ...lobsterStyle,
            }}
          />
        </Tooltip>

        {/* 对话气泡 */}
        {bubble.show && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 100,
              right: 8,
              background: 'rgba(18,18,42,0.92)',
              border: '1px solid rgba(0,212,255,0.35)',
              borderRadius: '10px',
              px: 1.5,
              py: 1,
              fontSize: '0.72rem',
              color: '#00D4FF',
              maxWidth: 140,
              zIndex: 3,
              animation: 'pixelpet-bubble 0.3s ease-out',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -6,
                right: 36,
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid rgba(0,212,255,0.35)',
              },
              '@keyframes pixelpet-bubble': {
                from: { opacity: 0, transform: 'translateY(6px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            {bubble.text}
          </Box>
        )}

        {/* 服务器LED闪烁 */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 62,
            left: 54,
            width: 4,
            height: 4,
            borderRadius: '50%',
            bgcolor: '#00FF41',
            zIndex: 2,
            opacity: 0.8,
            animation: 'led-blink 1.5s ease-in-out infinite',
            '@keyframes led-blink': {
              '0%, 100%': { opacity: 0.3 },
              '50%': { opacity: 1 },
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 56,
            left: 54,
            width: 4,
            height: 4,
            borderRadius: '50%',
            bgcolor: '#00FF41',
            zIndex: 2,
            opacity: 0.8,
            animation: 'led-blink 1.5s ease-in-out 0.5s infinite',
          }}
        />
      </Box>
    </Box>
  );
}

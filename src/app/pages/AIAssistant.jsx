import { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Avatar,
  CircularProgress,
  useTheme,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import client from '../../shared/api/client.js';

/**
 * AI 助手 Tab — 全屏 AI 对话界面
 */
export default function AIAssistant() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '你好！我是智码圈 AI 助手，有什么可以帮你的吗？',
    },
  ]);
  const [sending, setSending] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // 自动滚动到底部
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  // 输入框聚焦时隐藏底部导航（通过给 body 添加 class）
  useEffect(() => {
    if (focused) {
      document.body.classList.add('keyboard-open');
    } else {
      document.body.classList.remove('keyboard-open');
    }
    return () => document.body.classList.remove('keyboard-open');
  }, [focused]);

  const handleSend = async () => {
    const text = inputRef.current?.value?.trim();
    if (!text || sending) return;
    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    if (inputRef.current) inputRef.current.value = '';
    setSending(true);

    try {
      // 构建对话历史（最近 10 轮，不含刚加的 userMsg）
      const history = messages
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await client.post('/ai/chat', { message: text, history });

      if (res.code === 0 && res.data?.reply) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: res.data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: res.message || '抱歉，我没有理解你的问题。' },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '抱歉，网络连接失败，请稍后再试。' },
      ]);
    } finally {
      setSending(false);
      // 发送完后重新聚焦输入框
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex', flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* 消息列表 — 给底部输入框留空间 */}
      <Box
        ref={listRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 2, py: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          pb: 10,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { background: 'rgba(0,212,255,0.3)', borderRadius: 2 },
        }}
      >
        {messages.map((msg, i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              gap: 1.5,
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              alignItems: 'flex-start',
            }}
          >
            <Avatar
              sx={{
                width: 32, height: 32,
                bgcolor: msg.role === 'user' ? '#00B4D8' : '#9B59B6',
                fontSize: '0.8rem',
              }}
            >
              {msg.role === 'user' ? '我' : <SmartToyIcon sx={{ fontSize: 18 }} />}
            </Avatar>
            <Box
              sx={{
                maxWidth: '75%',
                px: 2, py: 1.2,
                borderRadius: 3,
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #00B4D8, #0077B6)'
                  : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                color: isDark ? '#e0e0e0' : '#1a1a2e',
                fontSize: '0.9rem',
                lineHeight: 1.5,
              }}
            >
              {msg.content}
            </Box>
          </Box>
        ))}

        {sending && (
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#9B59B6' }}>
              <SmartToyIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <CircularProgress size={16} sx={{ color: '#00D4FF' }} />
          </Box>
        )}
      </Box>

      {/* 输入框 — 固定在底部导航栏上方 */}
      <Box
        sx={{
          px: 2, py: 1.5,
          borderTop: '1px solid rgba(0,0,0,0.06)',
          background: isDark ? 'rgba(10, 10, 26, 0.95)' : '#ffffff',
          backdropFilter: 'blur(20px)',
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            size="small"
            inputRef={inputRef}
            defaultValue=""
            placeholder="输入消息..."
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
            multiline
            maxRows={4}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                '& fieldset': { borderColor: 'rgba(0,180,216,0.2)' },
                '&:hover fieldset': { borderColor: '#00B4D8' },
                '&.Mui-focused fieldset': { borderColor: '#00D4FF' },
              },
            }}
          />
          <IconButton
            onClick={handleSend}
            disabled={sending}
            sx={{
              color: '#00D4FF',
              bgcolor: 'rgba(0,212,255,0.1)',
              borderRadius: 2,
              alignSelf: 'flex-end',
              mb: 0.5,
              '&:hover': { bgcolor: 'rgba(0,212,255,0.2)' },
              '&.Mui-disabled': { color: isDark ? 'rgba(224,224,224,0.25)' : 'rgba(26,26,46,0.25)' },
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}

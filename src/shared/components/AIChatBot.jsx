import { useState, useRef, useEffect, useCallback } from 'react';
import { Box, IconButton, Typography, TextField, CircularProgress, Avatar, Fade, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_ENDPOINT = '/api/ai/chat';
const CACHE_KEY = 'ai_chat_history';
const CACHE_TTL = 30 * 60 * 1000;
const MAX_CACHED_MSGS = 20;

function loadCachedMessages() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const cached = JSON.parse(raw);
    const now = Date.now();

    if (now - cached.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return cached.messages || null;
  } catch {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

function saveCachedMessages(messages) {
  try {
    const toSave = messages.slice(-MAX_CACHED_MSGS);
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ timestamp: Date.now(), messages: toSave })
    );
  } catch {}
}

export default function AIChatBot() {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && user && messages.length === 0) {
      const cached = loadCachedMessages();
      if (cached && cached.length > 0) {
        setMessages(cached);
      } else {
        setMessages([
          {
            role: 'assistant',
            content: `👋 你好，${user.username}！我是智码圈 AI 助手，有什么可以帮助你的？`,
          },
        ]);
      }
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (!user) {
      setMessages([]);
      try { localStorage.removeItem(CACHE_KEY); } catch {}
    }
  }, [user]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading || !user) return;

    const userMsg = input.trim();
    setInput('');
    const newMessages = [...messagesRef.current, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const history = newMessages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await axios.post(
        API_ENDPOINT,
        {
          message: userMsg,
          history: history.slice(0, -1),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 60000,
        }
      );

      let finalMessages;
      if (res.data.code === 0) {
        finalMessages = [
          ...newMessages,
          { role: 'assistant', content: res.data.data.reply },
        ];
      } else {
        finalMessages = [
          ...newMessages,
          { role: 'assistant', content: `❌ ${res.data.message}` },
        ];
      }
      setMessages(finalMessages);
      saveCachedMessages(finalMessages);
    } catch (err) {
      const errorMessages = [
        ...newMessages,
        {
          role: 'assistant',
          content: '❌ 网络错误，请稍后重试',
        },
      ];
      setMessages(errorMessages);
      saveCachedMessages(errorMessages);
    } finally {
      setLoading(false);
    }
  }, [input, loading, user, token]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = useCallback(() => {
    saveCachedMessages(messagesRef.current);
    setIsOpen(false);
    setIsMinimized(false);
  }, []);

  const renderNotLoggedIn = () => (
    <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
      <SmartToyIcon sx={{ fontSize: 40, color: '#00D4FF', mb: 1 }} />
      <Typography variant="body2" sx={{ mb: 1 }}>登录后使用 AI 助手</Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>请点击右上角"登录"按钮</Typography>
    </Box>
  );

  const renderChat = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: isMinimized ? 0 : 400, overflow: 'hidden', transition: 'height 0.3s ease' }}>
      <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1,
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-thumb': { background: 'rgba(0, 212, 255, 0.3)', borderRadius: 2 },
      }}>
        {messages.map((msg, idx) => (
          <Box key={idx} sx={{ display: 'flex', gap: 1, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
            <Avatar sx={{ width: 28, height: 28, bgcolor: msg.role === 'user' ? '#9B59B6' : '#00B4D8', fontSize: '0.85rem' }}>
              {msg.role === 'user' ? 'U' : 'AI'}
            </Avatar>
            <Box sx={{ maxWidth: '75%', p: 1.2, borderRadius: 2, fontSize: '0.85rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              background: msg.role === 'user' ? 'linear-gradient(135deg, #00B4D8, #9B59B6)' : 'rgba(255, 255, 255, 0.06)',
              color: msg.role === 'user' ? '#fff' : '#e0e0e0',
              borderBottomRightRadius: msg.role === 'user' ? 4 : 2,
              borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 2,
            }}>
              {msg.content}
            </Box>
          </Box>
        ))}
        {loading && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', pl: 0.5 }}>
            <Avatar sx={{ width: 28, height: 28, bgcolor: '#00B4D8', fontSize: '0.85rem' }}>AI</Avatar>
            <CircularProgress size={16} sx={{ color: '#00D4FF' }} />
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      <Box sx={{ display: 'flex', gap: 0.5, p: 1, borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
        <TextField fullWidth size="small" placeholder="输入消息..." value={input}
          onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} disabled={loading}
          sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255,255,255,0.05)', borderRadius: 2, fontSize: '0.85rem', color: '#e0e0e0',
            '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
            '&:hover fieldset': { borderColor: '#00B4D8' },
            '&.Mui-focused fieldset': { borderColor: '#00D4FF' },
          }}} />
        <IconButton onClick={handleSend} disabled={!input.trim() || loading}
          sx={{ color: '#00D4FF', '&:disabled': { color: 'rgba(26,26,46,0.25)' }, '&:hover': { background: 'rgba(0,212,255,0.1)' } }}>
          <SendIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <>
      <Tooltip title="AI 助手" placement="left">
        <IconButton onClick={() => { setIsOpen(!isOpen); if (!isOpen) setIsMinimized(false); }}
          sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, width: 52, height: 52,
            background: 'linear-gradient(135deg, #00B4D8, #9B59B6)', color: '#1a1a2e',
            boxShadow: '0 4px 20px rgba(0, 180, 216, 0.4)',
            transition: 'all 0.3s ease',
            '&:hover': { transform: 'scale(1.1)', boxShadow: '0 6px 28px rgba(0, 180, 216, 0.6)' },
            '&::before': {
              content: '""', position: 'absolute', width: '100%', height: '100%', borderRadius: '50%',
              background: 'inherit', opacity: 0.5, animation: isOpen ? 'none' : 'pulse-ring 2s infinite',
            },
          }}>
          <SmartToyIcon sx={{ fontSize: 26, position: 'relative', zIndex: 1 }} />
        </IconButton>
      </Tooltip>

      <Fade in={isOpen}>
        <Box sx={{ position: 'fixed', bottom: 88, right: 24, zIndex: 9998, width: 360, maxWidth: 'calc(100vw - 48px)',
          borderRadius: 3, overflow: 'hidden', background: 'rgba(14, 14, 36, 0.95)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 8px 40px rgba(0, 0, 0, 0.5)',
          display: 'flex', flexDirection: 'column',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 1,
            borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SmartToyIcon sx={{ fontSize: 20, color: '#00D4FF' }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#e0e0e0' }}>AI 助手</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton size="small" onClick={() => setIsMinimized(!isMinimized)}
                sx={{ color: 'text.secondary', '&:hover': { color: '#00D4FF' } }}>
                {isMinimized ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
              </IconButton>
              <IconButton size="small" onClick={handleClose}
                sx={{ color: 'text.secondary', '&:hover': { color: '#ff5252' } }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          {user ? renderChat() : renderNotLoggedIn()}
        </Box>
      </Fade>

      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 0; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </>
  );
}

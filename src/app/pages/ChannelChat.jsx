import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Avatar, TextField, IconButton, List, ListItem, CircularProgress, Divider, Chip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import PeopleIcon from '@mui/icons-material/People';
import { useAuth } from '../../shared/contexts/AuthContext';
import client from '../../shared/api/client';
import { connectSocket, getSocket } from '../../shared/api/socket';

export default function ChannelChat() {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [channel, setChannel] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const listRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    const socket = connectSocket(token);
    socket.emit('join_channel', parseInt(channelId));
    const handleMessage = (msg) => { setMessages(prev => { if (prev.find(m => m.id === msg.id)) return prev; return [...prev, msg]; }); };
    socket.on('new_channel_message', handleMessage);
    return () => { socket.off('new_channel_message', handleMessage); socket.emit('leave_channel', parseInt(channelId)); };
  }, [token, channelId]);

  useEffect(() => { loadData(); }, [channelId]);
  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [messages]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [msgRes, chRes, memRes] = await Promise.all([
        client.get(`/api/social/channels/${channelId}/messages`),
        client.get('/api/social/channels'),
        client.get(`/api/social/channels/${channelId}/members`),
      ]);
      if (msgRes.data?.code === 0) setMessages(msgRes.data.data.messages);
      if (chRes.data?.code === 0) { const ch = chRes.data.data.find(c => c.id === parseInt(channelId)); if (ch) setChannel(ch); }
      if (memRes.data?.code === 0) setMembers(memRes.data.data);
    } catch {}
    setLoading(false);
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    const socket = getSocket();
    if (socket) { socket.emit('send_channel_message', { channel_id: parseInt(channelId), content: input.trim() }); setInput(''); }
  };

  return (
    <Container maxWidth="md" sx={{ py: 2, height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={() => navigate('/social')} sx={{ color: '#9B59B6' }}><ArrowBackIcon /></IconButton>
        <Avatar sx={{ bgcolor: '#9B59B6' }}>{channel?.name?.[0] || '#'}</Avatar>
        <Box sx={{ flex: 1 }}><Typography sx={{ fontWeight: 600 }}>{channel?.name || '频道'}</Typography><Typography variant="caption" color="text.secondary">{channel?.description || ''} · {members.length} 人在线</Typography></Box>
      </Box>
      <Divider sx={{ mb: 2 }} />
      <Box ref={listRef} sx={{ flex: 1, overflow: 'auto', mb: 2, px: 1 }}>
        {loading ? (<Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>) : messages.length === 0 ? (<Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}><Typography>频道还没有消息，说点什么吧 🎯</Typography></Box>) : (
          <List>{messages.map((msg) => { const isMe = msg.user_id === user?.id; return (
            <ListItem key={msg.id} sx={{ px: 0, py: 0.5, alignItems: 'flex-start' }}>
              {!isMe && <Avatar src={msg.avatar?.startsWith('http') ? msg.avatar : '/app/logo-default-avatar.png'} sx={{ width: 32, height: 32, mr: 1, mt: 0.5, bgcolor: 'transparent' }} />}
              <Box sx={{ maxWidth: isMe ? '70%' : 'calc(100% - 48px)', ml: isMe ? 'auto' : 0, p: 1.5, borderRadius: 2, bgcolor: isMe ? 'rgba(155,89,182,0.15)' : 'rgba(255,255,255,0.05)' }}>
                {!isMe && <Typography variant="caption" sx={{ color: '#9B59B6', display: 'block', mb: 0.5, fontWeight: 600 }}>{msg.username}<Chip label={msg.uid || ''} size="small" variant="outlined" sx={{ ml: 0.5, height: 16, fontSize: '0.6rem', color: 'rgba(26,26,46,0.45)' }} /></Typography>}
                <Typography variant="body2">{msg.content}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(26,26,46,0.35)', display: 'block', textAlign: 'right', mt: 0.5, fontSize: '0.65rem' }}>{msg.created_at ? new Date(msg.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : ''}</Typography>
              </Box>
            </ListItem>);})}</List>
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField fullWidth size="small" placeholder="输入消息..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} sx={{ '& input': { color: 'white' } }} />
        <IconButton onClick={sendMessage} sx={{ color: '#9B59B6', bgcolor: 'rgba(155,89,182,0.1)' }}><SendIcon /></IconButton>
      </Box>
    </Container>
  );
}

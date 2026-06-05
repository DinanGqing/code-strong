import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Avatar, TextField, IconButton, List, ListItem, CircularProgress, Divider } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import { useAuth } from '../../shared/contexts/AuthContext';
import client from '../../shared/api/client';
import { connectSocket, getSocket } from '../../shared/api/socket';

export default function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [friend, setFriend] = useState(null);
  const [loading, setLoading] = useState(true);
  const listRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    connectSocket(token);
    const socket = getSocket();
    const handleMessage = (msg) => { setMessages(prev => { if (prev.find(m => m.id === msg.id)) return prev; return [...prev, msg]; }); };
    socket.on('new_private_message', handleMessage);
    return () => { socket.off('new_private_message', handleMessage); };
  }, [token]);

  useEffect(() => { loadMessages(); loadFriendInfo(); }, [userId]);
  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [messages]);

  const loadMessages = async () => { setLoading(true); try { const res = await client.get(`/api/social/messages/${userId}`); if (res.data?.code === 0) setMessages(res.data.data.messages); } catch { setMessages([]); } setLoading(false); };
  const loadFriendInfo = async () => { try { const res = await client.get('/api/social/friends'); if (res.data?.code === 0) { const f = res.data.data.find(f => f.id === parseInt(userId)); if (f) setFriend(f); } } catch {} };

  const sendMessage = () => {
    if (!input.trim()) return;
    const socket = getSocket();
    if (socket) { socket.emit('send_private_message', { to_user_id: parseInt(userId), content: input.trim() }); }
    else { client.post('/api/social/messages', { to_user_id: parseInt(userId), content: input.trim() }).then(() => loadMessages()).catch(() => {}); }
    setInput('');
  };

  return (
    <Container maxWidth="md" sx={{ py: 2, height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={() => navigate('/social')} sx={{ color: '#00D4FF' }}><ArrowBackIcon /></IconButton>
        <Avatar src={friend?.avatar}>{friend?.username?.[0]}</Avatar>
        <Box><Typography sx={{ fontWeight: 600 }}>{friend?.username || '加载中...'}</Typography>{friend && <Typography variant="caption" color="text.secondary">{friend.uid}</Typography>}</Box>
      </Box>
      <Divider sx={{ mb: 2 }} />
      <Box ref={listRef} sx={{ flex: 1, overflow: 'auto', mb: 2, px: 1 }}>
        {loading ? (<Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>) : messages.length === 0 ? (<Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}><Typography>开始聊天吧 👋</Typography></Box>) : (
          <List>{messages.map((msg) => { const isMe = msg.from_user_id === user?.id; return (
            <ListItem key={msg.id} sx={{ justifyContent: isMe ? 'flex-end' : 'flex-start', px: 0, py: 0.5 }}>
              <Box sx={{ maxWidth: '70%', p: 1.5, borderRadius: 2, bgcolor: isMe ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)', borderBottomRightRadius: isMe ? 0 : 2, borderBottomLeftRadius: isMe ? 2 : 0 }}>
                {!isMe && <Typography variant="caption" sx={{ color: '#00D4FF', display: 'block', mb: 0.5 }}>{msg.username}</Typography>}
                <Typography variant="body2">{msg.content}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', display: 'block', textAlign: 'right', mt: 0.5, fontSize: '0.65rem' }}>{msg.created_at ? new Date(msg.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : ''}</Typography>
              </Box>
            </ListItem>);})}</List>
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField fullWidth size="small" placeholder="输入消息..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} sx={{ '& input': { color: 'white' } }} />
        <IconButton onClick={sendMessage} sx={{ color: '#00D4FF', bgcolor: 'rgba(0,212,255,0.1)' }}><SendIcon /></IconButton>
      </Box>
    </Container>
  );
}

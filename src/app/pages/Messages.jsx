import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Badge,
  Chip,
  CircularProgress,
} from '@mui/material';
import client from '../../shared/api/client';
import { useAuth } from '../../shared/contexts/AuthContext';

/**
 * 消息 Tab — 显示会话列表 + 好友请求
 */
export default function Messages() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    Promise.all([
      client.get('/api/social/conversations'),
      client.get('/api/social/friend/requests'),
    ])
      .then(([convRes, reqRes]) => {
        setConversations(convRes.data?.data || []);
        setPendingRequests(reqRes.data?.data?.length || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  // 格式化时间
  const formatTime = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (d.getDate() === now.getDate() && d.getMonth() === now.getMonth()) return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <Box sx={{ px: 2, pt: 2, pb: 1 }}>
      {/* 好友请求入口 */}
      {user && pendingRequests > 0 && (
        <Chip
          label={`${pendingRequests} 个好友请求待处理`}
          onClick={() => navigate('/social')}
          sx={{
            mb: 2,
            background: 'linear-gradient(135deg, #00B4D8, #9B59B6)',
            color: '#1a1a2e',
            fontWeight: 600,
            borderRadius: 2,
            width: '100%',
            py: 2.5,
            '& .MuiChip-label': { fontSize: '0.85rem' },
          }}
        />
      )}

      {!user ? (
        <Typography sx={{ color: 'rgba(26,26,46,0.45)', textAlign: 'center', mt: 6 }}>
          登录后查看消息
        </Typography>
      ) : loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress sx={{ color: '#00D4FF' }} />
        </Box>
      ) : conversations.length === 0 ? (
        <Typography sx={{ color: 'rgba(26,26,46,0.45)', textAlign: 'center', mt: 6 }}>
          暂无消息，去"频道"看看吧
        </Typography>
      ) : (
        <List sx={{ px: 0 }}>
          {conversations.map((conv) => (
            <ListItemButton
              key={conv.uid || conv.other_user_id}
              onClick={() => navigate(`/chat/${conv.other_user_id}`)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&:hover': { background: 'rgba(0,212,255,0.06)' },
              }}
            >
              <ListItemAvatar>
                <Badge
                  color="error"
                  badgeContent={conv.unread_count}
                  invisible={!conv.unread_count || conv.unread_count === 0}
                >
                  <Avatar
                    src={conv.avatar?.startsWith('http') ? conv.avatar : '/app/logo-default-avatar.png'}
                    sx={{ bgcolor: 'transparent', width: 44, height: 44 }}
                  />
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: conv.unread_count > 0 ? 700 : 500, color: '#1a1a2e', fontSize: '0.95rem' }}>
                      {conv.username}
                    </Typography>
                    <Typography sx={{ color: 'rgba(26,26,46,0.35)', fontSize: '0.7rem' }}>
                      {formatTime(conv.last_time)}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Typography
                    noWrap
                    sx={{
                      color: conv.unread_count > 0 ? 'rgba(26,26,46,0.65)' : 'rgba(26,26,46,0.4)',
                      fontSize: '0.8rem',
                      fontWeight: conv.unread_count > 0 ? 500 : 400,
                    }}
                  >
                    {conv.last_message || '暂无消息'}
                  </Typography>
                }
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </Box>
  );
}

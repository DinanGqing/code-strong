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
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
} from '@mui/material';
import ExploreIcon from '@mui/icons-material/Explore';
import client from '../../shared/api/client';
import { useAuth } from '../../shared/contexts/AuthContext';

/**
 * 频道 Tab — 显示已加入的频道列表 + 发现频道
 */
export default function Channels() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  // 发现频道弹窗
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [discoverResults, setDiscoverResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    client.get('/api/social/channels')
      .then((res) => setChannels(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleDiscover = async () => {
    setSearching(true);
    try {
      const res = await client.get('/api/social/channels/discover', {
        params: { q: searchQuery.trim() || undefined },
      });
      setDiscoverResults(res.data?.data || []);
    } catch {
      setDiscoverResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleJoinChannel = async (channelId) => {
    try {
      await client.post(`/api/social/channels/${channelId}/join`);
      setChannels((prev) => {
        const alreadyJoined = prev.some((c) => c.id === channelId);
        if (alreadyJoined) return prev;
        const joined = discoverResults.find((c) => c.id === channelId);
        return joined ? [...prev, joined] : prev;
      });
    } catch {}
  };

  return (
    <Box sx={{ px: 2, pt: 2, pb: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#1a1a2e' }}>
          频道
        </Typography>
        <Button
          startIcon={<ExploreIcon />}
          onClick={() => setDiscoverOpen(true)}
          sx={{ color: '#00D4FF', textTransform: 'none', fontSize: '0.85rem' }}
        >
          发现频道
        </Button>
      </Box>

      {!user ? (
        <Typography sx={{ color: 'rgba(26,26,46,0.45)', textAlign: 'center', mt: 6 }}>
          登录后加入频道
        </Typography>
      ) : loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress sx={{ color: '#00D4FF' }} />
        </Box>
      ) : channels.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Typography sx={{ color: 'rgba(26,26,46,0.45)', mb: 2 }}>
            还没有加入频道
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ExploreIcon />}
            onClick={() => setDiscoverOpen(true)}
            sx={{ borderColor: '#00B4D8', color: '#00D4FF', textTransform: 'none', borderRadius: 3 }}
          >
            发现频道
          </Button>
        </Box>
      ) : (
        <List sx={{ px: 0 }}>
          {channels.map((ch) => (
            <ListItemButton
              key={ch.id}
              onClick={() => navigate(`/channel/${ch.id}`)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&:hover': { background: 'rgba(0,212,255,0.06)' },
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: '#9B59B6', width: 44, height: 44 }}>
                  {ch.name?.charAt(0)?.toUpperCase() || '#'}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: 600, color: '#1a1a2e', fontSize: '0.95rem' }}>
                      # {ch.name}
                    </Typography>
                    <Typography sx={{ color: 'rgba(26,26,46,0.35)', fontSize: '0.75rem' }}>
                      {ch.member_count} 人
                    </Typography>
                  </Box>
                }
                secondary={
                  <Typography noWrap sx={{ color: 'rgba(26,26,46,0.4)', fontSize: '0.8rem' }}>
                    {ch.last_message || ch.description || '暂无消息'}
                  </Typography>
                }
              />
            </ListItemButton>
          ))}
        </List>
      )}

      {/* 发现频道弹窗 */}
      <Dialog
        open={discoverOpen}
        onClose={() => setDiscoverOpen(false)}
        PaperProps={{
          sx: {
            background: '#ffffff',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: 3,
            minWidth: 340,
            maxHeight: '70vh',
          },
        }}
      >
        <DialogTitle sx={{ color: '#1a1a2e', fontWeight: 700, pb: 1 }}>发现频道</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth size="small" value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索频道名称"
              onKeyDown={(e) => e.key === 'Enter' && handleDiscover()}
              sx={{ '& .MuiOutlinedInput-root': { color: '#1a1a2e', '& fieldset': { borderColor: 'rgba(0,180,216,0.4)' } } }}
            />
            <Button
              variant="contained" onClick={handleDiscover} disabled={searching}
              sx={{ background: 'linear-gradient(135deg, #00B4D8, #9B59B6)', textTransform: 'none', flexShrink: 0 }}
            >
              {searching ? <CircularProgress size={18} sx={{ color: '#1a1a2e' }} /> : '搜索'}
            </Button>
          </Box>

          {/* 热门频道（无搜索时） */}
          {!searchQuery.trim() && discoverResults.length === 0 && !searching && (
            <Button
              fullWidth variant="outlined"
              onClick={() => { setSearchQuery(''); handleDiscover(); }}
              sx={{ borderColor: 'rgba(0,180,216,0.4)', color: '#00D4FF', textTransform: 'none', mb: 1 }}
            >
              浏览热门频道
            </Button>
          )}

          {discoverResults.map((ch) => {
            const isMember = ch.is_member || channels.some((c) => c.id === ch.id);
            return (
              <Box
                key={ch.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.03)',
                  mb: 1,
                }}
              >
                <Avatar sx={{ bgcolor: '#9B59B6', width: 36, height: 36, fontSize: '0.85rem' }}>
                  {ch.name?.charAt(0)?.toUpperCase() || '#'}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}># {ch.name}</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(26,26,46,0.45)' }}>
                    {ch.member_count} 人 · {ch.description || '无描述'}
                  </Typography>
                </Box>
                {isMember ? (
                  <Button size="small" disabled sx={{ color: 'rgba(26,26,46,0.35)', textTransform: 'none' }}>
                    已加入
                  </Button>
                ) : (
                  <Button
                    size="small" variant="outlined"
                    onClick={() => handleJoinChannel(ch.id)}
                    sx={{ color: '#00D4FF', borderColor: 'rgba(0,212,255,0.4)', textTransform: 'none' }}
                  >
                    加入
                  </Button>
                )}
              </Box>
            );
          })}

          {discoverResults.length === 0 && searching && (
            <Typography sx={{ color: 'rgba(26,26,46,0.45)', textAlign: 'center', py: 4 }}>
              搜索中...
            </Typography>
          )}

          {discoverResults.length === 0 && !searching && searchQuery.trim() && (
            <Typography sx={{ color: 'rgba(26,26,46,0.45)', textAlign: 'center', py: 4 }}>
              未找到相关频道
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

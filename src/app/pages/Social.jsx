import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Tabs, Tab, Card, CardContent, List, ListItem, ListItemAvatar, Avatar, ListItemText, IconButton, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Badge, Chip, Divider, Snackbar, Alert, CircularProgress } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ChatIcon from '@mui/icons-material/Chat';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import SearchIcon from '@mui/icons-material/Search';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../../shared/contexts/AuthContext';
import client from '../../shared/api/client';
import { connectSocket, getSocket, disconnectSocket } from '../../shared/api/socket';

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ py: 2 }}>{children}</Box> : null;
}

export default function Social() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [myChannels, setMyChannels] = useState([]);
  const [discoverChannels, setDiscoverChannels] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [channelDesc, setChannelDesc] = useState('');
  const [discoverQuery, setDiscoverQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });

  const showToast = (msg, severity = 'success') => setToast({ open: true, msg, severity });

  useEffect(() => {
    if (token && user) {
      const socket = connectSocket(token);
      socket.on('friend_request_notification', () => { showToast('收到新的好友申请！', 'info'); loadFriendRequests(); });
      return () => { disconnectSocket(); };
    }
  }, [token, user]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [friendsRes, requestsRes, channelsRes] = await Promise.all([
        client.get('/api/social/friends'),
        client.get('/api/social/friend/requests'),
        client.get('/api/social/channels'),
      ]);
      if (friendsRes.data?.code === 0) setFriends(friendsRes.data.data);
      if (requestsRes.data?.code === 0) setFriendRequests(requestsRes.data.data);
      if (channelsRes.data?.code === 0) setMyChannels(channelsRes.data.data);
    } catch (err) { console.error('加载社交数据失败:', err); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try { const res = await client.get('/api/social/users/search?q=' + encodeURIComponent(searchQuery)); if (res.data?.code === 0) setSearchResults(res.data.data); }
    catch { setSearchResults([]); }
    setSearching(false);
  };

  const sendFriendRequest = async (to_uid) => {
    try { const res = await client.post('/api/social/friend/request', { to_uid }); showToast(res.data?.message || '已发送'); setSearchOpen(false); setSearchQuery(''); setSearchResults([]); loadData(); }
    catch (err) { showToast(err.response?.data?.message || '发送失败', 'error'); }
  };

  const respondRequest = async (requestId, action) => {
    try { const res = await client.post('/api/social/friend/respond', { request_id: requestId, action }); showToast(res.data?.message || '操作成功'); loadData(); }
    catch (err) { showToast(err.response?.data?.message || '操作失败', 'error'); }
  };

  const removeFriend = async (friendId) => {
    try { await client.delete('/api/social/friend/' + friendId); showToast('已删除好友'); loadData(); }
    catch { showToast('删除失败', 'error'); }
  };

  const createChannel = async () => {
    if (!channelName.trim()) return;
    try { const res = await client.post('/api/social/channels', { name: channelName, description: channelDesc }); showToast(res.data?.message || '创建成功'); setCreateOpen(false); setChannelName(''); setChannelDesc(''); loadData(); }
    catch (err) { showToast(err.response?.data?.message || '创建失败', 'error'); }
  };

  const loadDiscoverChannels = async (q) => {
    try { const url = q ? '/api/social/channels/discover?q=' + encodeURIComponent(q) : '/api/social/channels/discover'; const res = await client.get(url); if (res.data?.code === 0) setDiscoverChannels(res.data.data); }
    catch { setDiscoverChannels([]); }
  };

  useEffect(() => { if (tab === 1) loadDiscoverChannels(discoverQuery); }, [tab]);

  const joinChannel = async (channelId) => { try { const res = await client.post('/api/social/channels/' + channelId + '/join'); showToast(res.data?.message || '已加入'); loadDiscoverChannels(discoverQuery); loadData(); } catch (err) { showToast(err.response?.data?.message || '加入失败', 'error'); } };
  const leaveChannel = async (channelId) => { try { const res = await client.post('/api/social/channels/' + channelId + '/leave'); showToast(res.data?.message || '已退出'); loadData(); loadDiscoverChannels(discoverQuery); } catch (err) { showToast(err.response?.data?.message || '退出失败', 'error'); } };

  function renderSearchResults() {
    if (searchResults.length === 0) return null;
    return (
      <List sx={{ mt: 1 }}>
        {searchResults.map(function(u) {
          const addButton = (
            <Button size="small" variant="outlined" onClick={function() { sendFriendRequest(u.uid); }}>
              添加
            </Button>
          );
          return (
            <ListItem key={u.id} sx={{ borderRadius: 1, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }} secondaryAction={addButton}>
              <ListItemAvatar>
                <Avatar
                  src={u.avatar?.startsWith('http') ? u.avatar : '/app/logo-default-avatar.png'}
                  sx={{ bgcolor: 'transparent', width: 40, height: 40 }}
                />
              </ListItemAvatar>
              <ListItemText primary={u.username} secondary={u.uid} />
            </ListItem>
          );
        })}
      </List>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, color: '#00D4FF' }}>社交中心</Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label={'好友 (' + friends.length + ')'} />
        <Tab label={'频道 (' + myChannels.length + ')'} />
      </Tabs>

      <TabPanel value={tab} index={0}>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          {friendRequests.length > 0 && (
            <Button variant="outlined" color="warning" startIcon={<PersonAddIcon />} onClick={() => setTab(2)} size="small">
              好友申请 ({friendRequests.length})
            </Button>
          )}
          <Button variant="contained" startIcon={<SearchIcon />} onClick={() => setSearchOpen(true)} size="small"
            sx={{ background: 'linear-gradient(135deg, #00D4FF, #0088CC)' }}>添加好友</Button>
        </Box>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
        ) : friends.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <PersonAddIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
            <Typography>还没有好友</Typography>
            <Typography variant="body2">点击"添加好友"通过 UID 搜索添加</Typography>
          </Box>
        ) : (
          <List sx={{ bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
            {friends.map(function(f) {
              return (
                <ListItem key={f.id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                  secondaryAction={
                    <Box>
                      <IconButton onClick={function() { navigate('/chat/' + f.id); }} sx={{ color: '#00D4FF' }}><ChatIcon /></IconButton>
                      <IconButton onClick={function() { removeFriend(f.id); }} sx={{ color: 'rgba(26,26,46,0.35)' }}><DeleteIcon /></IconButton>
                    </Box>
                  }>
                  <ListItemAvatar>
                    <Badge badgeContent={f.unread_count} color="error">
                      <Avatar
                        src={f.avatar?.startsWith('http') ? f.avatar : '/app/logo-default-avatar.png'}
                        sx={{ bgcolor: 'transparent', width: 40, height: 40 }}
                      />
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}><Typography>{f.username}</Typography><Chip label={f.uid} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} /></Box>}
                    secondary={f.bio || ''} />
                </ListItem>
              );
            })}
          </List>
        )}
        {tab === 2 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>好友申请</Typography>
            {friendRequests.length === 0 ? (
              <Typography variant="body2" color="text.secondary">暂无申请</Typography>
            ) : friendRequests.map(function(req) {
              return (
                <Card key={req.id} sx={{ mb: 1, bgcolor: 'rgba(255,255,255,0.03)' }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
                    <Avatar
                      src={req.avatar?.startsWith('http') ? req.avatar : '/app/logo-default-avatar.png'}
                      sx={{ bgcolor: 'transparent', width: 40, height: 40 }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{req.username}</Typography>
                      <Typography variant="caption" color="text.secondary">{req.uid}</Typography>
                    </Box>
                    <IconButton onClick={function() { respondRequest(req.id, 'accept'); }} sx={{ color: '#00FF88' }}><CheckIcon /></IconButton>
                    <IconButton onClick={function() { respondRequest(req.id, 'reject'); }} sx={{ color: '#FF4444' }}><CloseIcon /></IconButton>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button variant="contained" startIcon={<GroupAddIcon />} onClick={() => setCreateOpen(true)} size="small"
            sx={{ background: 'linear-gradient(135deg, #9B59B6, #7D3C98)' }}>创建频道</Button>
        </Box>
        {myChannels.length > 0 && (
          <>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>我的频道</Typography>
            <List sx={{ bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, mb: 3 }}>
              {myChannels.map(function(ch) {
                const leaveBtn = (
                  <IconButton onClick={function(e) { e.stopPropagation(); leaveChannel(ch.id); }} size="small" sx={{ color: 'rgba(26,26,46,0.35)' }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                );
                return (
                  <ListItem key={ch.id} sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                    onClick={function() { navigate('/channel/' + ch.id); }} secondaryAction={leaveBtn}>
                    <ListItemAvatar><Avatar sx={{ bgcolor: '#9B59B6' }}>{ch.name?.[0]}</Avatar></ListItemAvatar>
                    <ListItemText
                      primary={<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}><Typography>{ch.name}</Typography><Chip label={ch.member_count + '人'} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} /></Box>}
                      secondary={ch.last_message ? '最新: ' + ch.last_message.substring(0, 30) + (ch.last_message.length > 30 ? '...' : '') : '暂无消息'} />
                  </ListItem>
                );
              })}
            </List>
          </>
        )}
        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>发现频道</Typography>
        <TextField size="small" fullWidth placeholder="搜索频道..." value={discoverQuery}
          onChange={function(e) { setDiscoverQuery(e.target.value); loadDiscoverChannels(e.target.value); }}
          sx={{ mb: 2, '& input': { color: 'white' } }} />
        {discoverChannels.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>暂无公开频道</Typography>
        ) : discoverChannels.filter(function(ch) { return !myChannels.find(function(mc) { return mc.id === ch.id; }); }).map(function(ch) {
          return (
            <Card key={ch.id} sx={{ mb: 1, bgcolor: 'rgba(255,255,255,0.03)' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
                <Avatar sx={{ bgcolor: '#9B59B6' }}>{ch.name?.[0]}</Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{ch.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{ch.member_count} 人 · {ch.description ? ch.description.substring(0, 40) : '暂无简介'}</Typography>
                </Box>
                <Button size="small" variant="outlined" onClick={function() { joinChannel(ch.id); }}>加入</Button>
              </CardContent>
            </Card>
          );
        })}
      </TabPanel>

      <Dialog open={searchOpen} onClose={function() { setSearchOpen(false); }} maxWidth="xs" fullWidth
        PaperProps={{ sx: { bgcolor: '#1a1a2e' } }}>
        <DialogTitle>添加好友</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, p: 1.5, bgcolor: 'rgba(0,212,255,0.08)', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              你的 UID：<strong style={{ color: '#00D4FF', fontSize: '1rem' }}>{user?.uid || '未知'}</strong>
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary">告诉朋友你的 UID，或者搜索对方的 UID 添加好友</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField fullWidth size="small" placeholder="输入 UID 或用户名搜索..." value={searchQuery}
              onChange={function(e) { setSearchQuery(e.target.value); }}
              onKeyDown={function(e) { if (e.key === 'Enter') handleSearch(); }}
              sx={{ '& input': { color: 'white' } }} />
            <Button variant="contained" onClick={handleSearch} disabled={searching}
              sx={{ background: 'linear-gradient(135deg,#00D4FF,#0088CC)', minWidth: 40 }}>
              {searching ? <CircularProgress size={20} /> : <SearchIcon />}
            </Button>
          </Box>
          {renderSearchResults()}
          {searchQuery && searchResults.length === 0 && !searching && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>未找到匹配的用户</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={function() { setSearchOpen(false); }}>关闭</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createOpen} onClose={function() { setCreateOpen(false); }} maxWidth="xs" fullWidth
        PaperProps={{ sx: { bgcolor: '#1a1a2e' } }}>
        <DialogTitle>创建频道</DialogTitle>
        <DialogContent>
          <TextField fullWidth size="small" label="频道名称" value={channelName}
            onChange={function(e) { setChannelName(e.target.value); }}
            sx={{ mb: 2, '& input': { color: 'white' }, '& label': { color: 'rgba(26,26,46,0.55)' } }} />
          <TextField fullWidth size="small" label="频道简介（选填）" value={channelDesc}
            onChange={function(e) { setChannelDesc(e.target.value); }} multiline rows={2}
            sx={{ '& textarea': { color: 'white' }, '& label': { color: 'rgba(26,26,46,0.55)' } }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={function() { setCreateOpen(false); }}>取消</Button>
          <Button variant="contained" onClick={createChannel}
            sx={{ background: 'linear-gradient(135deg,#9B59B6,#7D3C98)' }}>创建</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={function() { setToast({ ...toast, open: false }); }}
        anchorOrigin={{ vertical: 'center', horizontal: 'center' }}>
        <Alert severity={toast.severity} variant="filled">{toast.msg}</Alert>
      </Snackbar>
    </Container>
  );
}

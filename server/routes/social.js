import { Router } from 'express';
import { getDatabase, saveDatabase } from '../db/database.js';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'code_strong_secret_key_2025';

/** 解析 JWT 获取当前用户ID */
function getUserId(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET);
    return decoded.id || decoded.userId || null;
  } catch { return null; }
}

/** 登录中间件 */
function authGuard(req, res, next) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ code: 401, message: '请先登录' });
  req.userId = userId;
  next();
}

// ==============================
// 用户搜索（按 UID 或用户名）
// ==============================
router.get('/users/search', authGuard, (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ code: 0, data: [] });

  const db = getDatabase();
  const users = db.prepare(`
    SELECT id, username, uid, avatar, bio FROM users
    WHERE uid LIKE ? OR username LIKE ? LIMIT 20
  `).all(`%${q}%`, `%${q}%`);

  // 过滤掉自己
  const filtered = users.filter(u => u.id !== req.userId);
  res.json({ code: 0, data: filtered });
});

// ==============================
// 好友申请
// ==============================
router.post('/friend/request', authGuard, (req, res) => {
  const { to_uid } = req.body;
  if (!to_uid) return res.status(400).json({ code: 400, message: '缺少目标用户UID' });

  const db = getDatabase();
  const target = db.prepare('SELECT id FROM users WHERE uid = ?').get(to_uid);
  if (!target) return res.status(404).json({ code: 404, message: '用户不存在' });
  if (target.id === req.userId) return res.status(400).json({ code: 400, message: '不能添加自己为好友' });

  // 检查是否已经是好友
  const existing = db.prepare('SELECT id FROM friends WHERE user_id = ? AND friend_id = ?').get(req.userId, target.id);
  if (existing) return res.status(400).json({ code: 400, message: '已经是好友了' });

  // 检查是否有待处理的申请
  const pending = db.prepare(
    "SELECT id FROM friend_requests WHERE from_user_id = ? AND to_user_id = ? AND status = 'pending'"
  ).get(req.userId, target.id);
  if (pending) return res.status(400).json({ code: 400, message: '已经发送过好友申请了' });

  // 检查是否有反向待处理的申请（对方申请过我）
  const reverse = db.prepare(
    "SELECT id FROM friend_requests WHERE from_user_id = ? AND to_user_id = ? AND status = 'pending'"
  ).get(target.id, req.userId);
  if (reverse) {
    // 直接自动接受
    db.prepare("UPDATE friend_requests SET status = 'accepted' WHERE id = ?").run(reverse.id);
    db.prepare('INSERT INTO friends (user_id, friend_id) VALUES (?, ?)').run(req.userId, target.id);
    db.prepare('INSERT INTO friends (user_id, friend_id) VALUES (?, ?)').run(target.id, req.userId);
    saveDatabase();
    return res.json({ code: 0, message: '对方已向你发送过申请，已自动互为好友', auto_accepted: true });
  }

  db.prepare('INSERT INTO friend_requests (from_user_id, to_user_id) VALUES (?, ?)').run(req.userId, target.id);
  saveDatabase();
  res.json({ code: 0, message: '好友申请已发送' });
});

// 查看我收到的好友申请
router.get('/friend/requests', authGuard, (req, res) => {
  const db = getDatabase();
  const requests = db.prepare(`
    SELECT fr.id, fr.status, fr.created_at,
           u.id as user_id, u.username, u.uid, u.avatar, u.bio
    FROM friend_requests fr
    JOIN users u ON fr.from_user_id = u.id
    WHERE fr.to_user_id = ? AND fr.status = 'pending'
    ORDER BY fr.created_at DESC
  `).all(req.userId);
  res.json({ code: 0, data: requests });
});

// 我发出的好友申请状态
router.get('/friend/sent-requests', authGuard, (req, res) => {
  const db = getDatabase();
  const requests = db.prepare(`
    SELECT fr.id, fr.status, fr.created_at,
           u.id as user_id, u.username, u.uid, u.avatar
    FROM friend_requests fr
    JOIN users u ON fr.to_user_id = u.id
    WHERE fr.from_user_id = ?
    ORDER BY fr.created_at DESC
  `).all(req.userId);
  res.json({ code: 0, data: requests });
});

// 回应好友申请
router.post('/friend/respond', authGuard, (req, res) => {
  const { request_id, action } = req.body; // action: accept / reject
  if (!request_id || !action) return res.status(400).json({ code: 400, message: '参数不足' });

  const db = getDatabase();
  const request = db.prepare('SELECT * FROM friend_requests WHERE id = ?').get(request_id);
  if (!request) return res.status(404).json({ code: 404, message: '申请不存在' });
  if (request.to_user_id !== req.userId) return res.status(403).json({ code: 403, message: '无权操作' });

  if (action === 'accept') {
    db.prepare("UPDATE friend_requests SET status = 'accepted' WHERE id = ?").run(request_id);
    db.prepare('INSERT INTO friends (user_id, friend_id) VALUES (?, ?)').run(req.userId, request.from_user_id);
    db.prepare('INSERT INTO friends (user_id, friend_id) VALUES (?, ?)').run(request.from_user_id, req.userId);
  } else {
    db.prepare("UPDATE friend_requests SET status = 'rejected' WHERE id = ?").run(request_id);
  }

  saveDatabase();
  res.json({ code: 0, message: action === 'accept' ? '已接受好友申请' : '已拒绝好友申请' });
});

// ==============================
// 好友列表
// ==============================
router.get('/friends', authGuard, (req, res) => {
  const db = getDatabase();
  const friends = db.prepare(`
    SELECT u.id, u.username, u.uid, u.avatar, u.bio, f.created_at as friend_since,
           (SELECT COUNT(*) FROM private_messages WHERE ((from_user_id = ? AND to_user_id = u.id) OR (from_user_id = u.id AND to_user_id = ?)) AND is_read = 0) as unread_count
    FROM friends f
    JOIN users u ON f.friend_id = u.id
    WHERE f.user_id = ?
    ORDER BY u.username
  `).all(req.userId, req.userId, req.userId);
  res.json({ code: 0, data: friends });
});

// 删除好友
router.delete('/friend/:friendId', authGuard, (req, res) => {
  const { friendId } = req.params;
  const db = getDatabase();
  db.prepare('DELETE FROM friends WHERE user_id = ? AND friend_id = ?').run(req.userId, friendId);
  db.prepare('DELETE FROM friends WHERE user_id = ? AND friend_id = ?').run(friendId, req.userId);
  saveDatabase();
  res.json({ code: 0, message: '已删除好友' });
});

// ==============================
// 私聊消息
// ==============================
// 获取与某人的聊天记录
router.get('/messages/:userId', authGuard, (req, res) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = 50;
  const offset = (page - 1) * limit;

  const db = getDatabase();
  const messages = db.prepare(`
    SELECT pm.*, u.username, u.avatar
    FROM private_messages pm
    JOIN users u ON pm.from_user_id = u.id
    WHERE (pm.from_user_id = ? AND pm.to_user_id = ?) OR (pm.from_user_id = ? AND pm.to_user_id = ?)
    ORDER BY pm.created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.userId, userId, userId, req.userId, limit, offset);

  // 标记为已读
  db.prepare('UPDATE private_messages SET is_read = 1 WHERE from_user_id = ? AND to_user_id = ? AND is_read = 0').run(userId, req.userId);
  saveDatabase();

  res.json({ code: 0, data: { messages: messages.reverse(), page, limit } });
});

// 获取会话列表
router.get('/conversations', authGuard, (req, res) => {
  const db = getDatabase();
  const conversations = db.prepare(`
    SELECT DISTINCT
      CASE WHEN pm.from_user_id = ? THEN pm.to_user_id ELSE pm.from_user_id END as other_user_id,
      u.username, u.uid, u.avatar,
      (SELECT content FROM private_messages WHERE (from_user_id = ? AND to_user_id = other_user_id) OR (from_user_id = other_user_id AND to_user_id = ?) ORDER BY created_at DESC LIMIT 1) as last_message,
      (SELECT created_at FROM private_messages WHERE (from_user_id = ? AND to_user_id = other_user_id) OR (from_user_id = other_user_id AND to_user_id = ?) ORDER BY created_at DESC LIMIT 1) as last_time,
      (SELECT COUNT(*) FROM private_messages WHERE from_user_id = other_user_id AND to_user_id = ? AND is_read = 0) as unread_count
    FROM private_messages pm
    JOIN users u ON (CASE WHEN pm.from_user_id = ? THEN pm.to_user_id ELSE pm.from_user_id END) = u.id
    WHERE pm.from_user_id = ? OR pm.to_user_id = ?
    ORDER BY last_time DESC
  `).all(req.userId, req.userId, req.userId, req.userId, req.userId, req.userId, req.userId, req.userId, req.userId);
  res.json({ code: 0, data: conversations });
});

// ==============================
// 频道
// ==============================
// 创建频道
router.post('/channels', authGuard, (req, res) => {
  const { name, description, avatar } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ code: 400, message: '频道名称不能为空' });

  const db = getDatabase();
  const result = db.prepare('INSERT INTO channels (name, description, avatar, creator_id) VALUES (?, ?, ?, ?)').run(
    name.trim(), description || '', avatar || '', req.userId
  );
  const channelId = result.lastInsertRowid;

  // 创建者自动成为管理员并加入频道
  db.prepare('INSERT INTO channel_members (channel_id, user_id, role) VALUES (?, ?, ?)').run(channelId, req.userId, 'admin');
  saveDatabase();

  const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(channelId);
  res.json({ code: 0, data: channel, message: '频道创建成功' });
});

// 查看我加入的频道
router.get('/channels', authGuard, (req, res) => {
  const db = getDatabase();
  const channels = db.prepare(`
    SELECT c.*, 
           (SELECT COUNT(*) FROM channel_members WHERE channel_id = c.id) as member_count,
           (SELECT content FROM channel_messages WHERE channel_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
    FROM channels c
    JOIN channel_members cm ON c.id = cm.channel_id
    WHERE cm.user_id = ?
    ORDER BY c.created_at DESC
  `).all(req.userId);
  res.json({ code: 0, data: channels });
});

// 发现频道（搜索公开频道）
router.get('/channels/discover', authGuard, (req, res) => {
  const q = (req.query.q || '').trim();
  const db = getDatabase();

  let channels;
  if (q) {
    channels = db.prepare(`
      SELECT c.*, (SELECT COUNT(*) FROM channel_members WHERE channel_id = c.id) as member_count,
             (SELECT user_id FROM channel_members WHERE channel_id = c.id AND user_id = ?) as is_member
      FROM channels c WHERE c.name LIKE ? OR c.description LIKE ?
      ORDER BY member_count DESC LIMIT 50
    `).all(req.userId, `%${q}%`, `%${q}%`);
  } else {
    channels = db.prepare(`
      SELECT c.*, (SELECT COUNT(*) FROM channel_members WHERE channel_id = c.id) as member_count,
             (SELECT user_id FROM channel_members WHERE channel_id = c.id AND user_id = ?) as is_member
      FROM channels c ORDER BY member_count DESC LIMIT 50
    `).all(req.userId);
  }

  channels = channels.map(c => ({ ...c, is_member: !!c.is_member }));
  res.json({ code: 0, data: channels });
});

// 加入频道
router.post('/channels/:id/join', authGuard, (req, res) => {
  const channelId = req.params.id;
  const db = getDatabase();

  const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(channelId);
  if (!channel) return res.status(404).json({ code: 404, message: '频道不存在' });

  const existing = db.prepare('SELECT id FROM channel_members WHERE channel_id = ? AND user_id = ?').get(channelId, req.userId);
  if (existing) return res.status(400).json({ code: 400, message: '已经在该频道中' });

  db.prepare('INSERT INTO channel_members (channel_id, user_id) VALUES (?, ?)').run(channelId, req.userId);
  saveDatabase();
  res.json({ code: 0, message: '已加入频道' });
});

// 退出频道
router.post('/channels/:id/leave', authGuard, (req, res) => {
  const channelId = req.params.id;
  const db = getDatabase();

  const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(channelId);
  if (!channel) return res.status(404).json({ code: 404, message: '频道不存在' });

  // 创建者不能退出
  if (channel.creator_id === req.userId) {
    return res.status(400).json({ code: 400, message: '创建者不能退出频道，如需解散请联系管理员' });
  }

  db.prepare('DELETE FROM channel_members WHERE channel_id = ? AND user_id = ?').run(channelId, req.userId);
  saveDatabase();
  res.json({ code: 0, message: '已退出频道' });
});

// 获取频道成员
router.get('/channels/:id/members', authGuard, (req, res) => {
  const db = getDatabase();
  const members = db.prepare(`
    SELECT u.id, u.username, u.uid, u.avatar, cm.role, cm.joined_at
    FROM channel_members cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.channel_id = ?
    ORDER BY cm.role DESC, cm.joined_at ASC
  `).all(req.params.id);
  res.json({ code: 0, data: members });
});

// 获取频道消息
router.get('/channels/:id/messages', authGuard, (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = 50;
  const offset = (page - 1) * limit;

  const db = getDatabase();
  const messages = db.prepare(`
    SELECT cm.*, u.username, u.uid, u.avatar
    FROM channel_messages cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.channel_id = ?
    ORDER BY cm.created_at DESC
    LIMIT ? OFFSET ?
  `).all(id, limit, offset);

  res.json({ code: 0, data: { messages: messages.reverse(), page, limit } });
});

// 踢出频道成员（管理员）
router.post('/channels/:id/kick', authGuard, (req, res) => {
  const { user_id } = req.body;
  const channelId = req.params.id;
  const db = getDatabase();

  const member = db.prepare('SELECT role FROM channel_members WHERE channel_id = ? AND user_id = ?').get(channelId, req.userId);
  if (!member || member.role !== 'admin') return res.status(403).json({ code: 403, message: '只有管理员可以踢人' });

  const target = db.prepare('SELECT role FROM channel_members WHERE channel_id = ? AND user_id = ?').get(channelId, user_id);
  if (!target) return res.status(404).json({ code: 404, message: '成员不在频道中' });
  if (target.role === 'admin') return res.status(400).json({ code: 400, message: '不能踢出管理员' });

  db.prepare('DELETE FROM channel_members WHERE channel_id = ? AND user_id = ?').run(channelId, user_id);
  saveDatabase();
  res.json({ code: 0, message: '已踢出成员' });
});

// 删除/解散频道（创建者）
router.delete('/channels/:id', authGuard, (req, res) => {
  const channelId = req.params.id;
  const db = getDatabase();

  const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(channelId);
  if (!channel) return res.status(404).json({ code: 404, message: '频道不存在' });
  if (channel.creator_id !== req.userId) return res.status(403).json({ code: 403, message: '只有创建者可以解散频道' });

  db.prepare('DELETE FROM channel_messages WHERE channel_id = ?').run(channelId);
  db.prepare('DELETE FROM channel_members WHERE channel_id = ?').run(channelId);
  db.prepare('DELETE FROM channels WHERE id = ?').run(channelId);
  saveDatabase();
  res.json({ code: 0, message: '频道已解散' });
});

export default router;

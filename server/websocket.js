import { Server } from 'socket.io';
import { getDatabase, saveDatabase } from './db/database.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'code_strong_secret_key_2025';

/**
 * 初始化 Socket.IO WebSocket 服务
 * @param {import('http').Server} httpServer
 */
export function initWebSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  // 认证中间件
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('未提供认证令牌'));

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.userId;
      socket.username = decoded.username || '匿名';
      next();
    } catch {
      next(new Error('令牌无效'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[WS] 用户 ${socket.userId} 已连接`);

    // 加入个人房间（用于接收私信通知）
    socket.join(`user:${socket.userId}`);

    // —— 私聊 ——
    socket.on('send_private_message', (data) => {
      const { to_user_id, content } = data;
      if (!to_user_id || !content?.trim()) return;

      const db = getDatabase();
      const result = db.prepare(
        'INSERT INTO private_messages (from_user_id, to_user_id, content) VALUES (?, ?, ?)'
      ).run(socket.userId, to_user_id, content.trim());
      db.save();

      const message = {
        id: result.lastInsertRowid,
        from_user_id: socket.userId,
        to_user_id,
        content: content.trim(),
        is_read: 0,
        created_at: new Date().toISOString(),
      };

      // 发送给接收方
      io.to(`user:${to_user_id}`).emit('new_private_message', message);
      // 也发给自己（发送方）
      socket.emit('new_private_message', message);
    });

    // —— 频道 ——
    socket.on('join_channel', (channelId) => {
      socket.join(`channel:${channelId}`);
    });

    socket.on('leave_channel', (channelId) => {
      socket.leave(`channel:${channelId}`);
    });

    socket.on('send_channel_message', (data) => {
      const { channel_id, content } = data;
      if (!channel_id || !content?.trim()) return;

      const db = getDatabase();

      // 验证用户是频道成员
      const member = db.prepare(
        'SELECT id FROM channel_members WHERE channel_id = ? AND user_id = ?'
      ).get(channel_id, socket.userId);
      if (!member) return socket.emit('error_msg', '你不是该频道成员');

      const result = db.prepare(
        'INSERT INTO channel_messages (channel_id, user_id, content) VALUES (?, ?, ?)'
      ).run(channel_id, socket.userId, content.trim());
      db.save();

      const message = {
        id: result.lastInsertRowid,
        channel_id,
        user_id: socket.userId,
        username: socket.username,
        content: content.trim(),
        created_at: new Date().toISOString(),
      };

      io.to(`channel:${channel_id}`).emit('new_channel_message', message);
    });

    // —— 好友申请通知（当有人申请好友时通知接收方） ——
    socket.on('friend_request_sent', (toUserId) => {
      io.to(`user:${toUserId}`).emit('friend_request_notification');
    });

    socket.on('disconnect', () => {
      console.log(`[WS] 用户 ${socket.userId} 已断开`);
    });
  });

  console.log('[WS] Socket.IO 已初始化');
  return io;
}

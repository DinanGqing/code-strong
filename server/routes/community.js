import { Router } from 'express';
import { getDatabase, saveDatabase } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { sensitiveCheckMiddleware } from '../utils/sensitive-words.js';

const router = Router();

/**
 * GET /api/community/activities
 * 返回社区动态列表（按时间倒序）
 */
router.get('/activities', (req, res) => {
  try {
    const db = getDatabase();

    const activities = db.prepare(`
      SELECT id, username, action, target, tag, created_at
      FROM community_activities
      ORDER BY created_at DESC
      LIMIT 50
    `).all();

    const result = activities.map((item) => ({
      id: item.id,
      username: item.username,
      action: item.action,
      target: item.target,
      tag: item.tag,
      created_at: item.created_at,
    }));

    return res.json({
      code: 0,
      data: { activities: result },
      message: 'ok',
    });
  } catch (err) {
    console.error('[Community] activities error:', err);
    return res.status(500).json({ code: 500, data: null, message: '服务器内部错误' });
  }
});

/**
 * POST /api/community/post
 * 发表社区动态（需登录 + 敏感词校验）
 */
router.post('/post', authMiddleware, sensitiveCheckMiddleware, (req, res) => {
  try {
    const { action, target, tag } = req.body;
    const db = getDatabase();

    if (!action || !action.trim()) {
      return res.json({ code: 1, data: null, message: '内容不能为空' });
    }

    const user = db.prepare('SELECT username FROM users WHERE id = ?').get(req.user.id);
    const result = db.prepare(
      'INSERT INTO community_activities (username, action, target, tag) VALUES (?, ?, ?, ?)'
    ).run(user?.username || '未知', action.trim(), (target || '').trim(), (tag || '').trim());

    saveDatabase();
    console.log(`[Community] 新帖子 id=${result.lastInsertRowid} by ${user?.username}`);
    return res.json({ code: 0, data: { id: result.lastInsertRowid }, message: '发布成功' });
  } catch (err) {
    console.error('[Community] post error:', err);
    return res.status(500).json({ code: 500, data: null, message: '服务器内部错误' });
  }
});

export default router;

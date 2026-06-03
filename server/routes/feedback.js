import { Router } from 'express';
import { getDatabase, saveDatabase } from '../db/database.js';
import { optionalAuth, authMiddleware } from '../middleware/auth.js';
import { sendFeedbackNotification } from '../utils/email.js';

const router = Router();

/**
 * POST /api/feedback
 * 提交用户反馈/举报
 * 登录可选：已登录自动关联用户，未登录也可提交
 */
router.post('/', optionalAuth, (req, res) => {
  try {
    const { type, title, description, contact } = req.body;

    if (!type || !['举报', '建议', '问题反馈', '其他'].includes(type)) {
      return res.json({ code: 1, data: null, message: '请选择反馈类型' });
    }
    if (!title || !title.trim()) {
      return res.json({ code: 1, data: null, message: '标题不能为空' });
    }
    if (!description || !description.trim()) {
      return res.json({ code: 1, data: null, message: '描述不能为空' });
    }
    // 未登录用户必须提供联系方式
    if (!req.user && (!contact || !contact.trim())) {
      return res.json({ code: 1, data: null, message: '请填写联系方式，方便我们回复' });
    }

    const db = getDatabase();

    db.exec(`
      CREATE TABLE IF NOT EXISTS feedbacks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        contact TEXT DEFAULT '',
        status TEXT DEFAULT '待处理',
        created_at TEXT DEFAULT (datetime('now', 'localtime'))
      )
    `);

    const result = db.prepare(
      'INSERT INTO feedbacks (user_id, type, title, description, contact) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user?.id || null, type, title.trim(), description.trim(), (contact || '').trim());

    saveDatabase();

    // 异步发邮件通知管理员
    const username = req.user?.id
      ? db.prepare('SELECT username FROM users WHERE id = ?').get(req.user.id)?.username
      : null;
    sendFeedbackNotification({ type, title: title.trim(), description: description.trim(), contact: contact?.trim(), username }).catch(err => console.error('[Feedback] 邮件发送失败:', err));

    console.log(`[Feedback] 新建反馈 id=${result.lastInsertRowid} type=${type} user=${req.user?.id || '匿名'}`);
    return res.json({ code: 0, data: { id: result.lastInsertRowid }, message: '感谢你的反馈，我们会尽快处理！' });
  } catch (err) {
    console.error('[Feedback] error:', err);
    return res.status(500).json({ code: 500, data: null, message: '服务器内部错误' });
  }
});

/**
 * GET /api/feedback
 * 查看反馈列表（需登录）
 */
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDatabase();
    const feedbacks = db.prepare(
      'SELECT id, user_id, type, title, description, contact, status, created_at FROM feedbacks ORDER BY id DESC LIMIT 50'
    ).all();
    return res.json({ code: 0, data: { feedbacks }, message: 'ok' });
  } catch (err) {
    console.error('[Feedback] list error:', err);
    return res.status(500).json({ code: 500, data: null, message: '服务器内部错误' });
  }
});

export default router;

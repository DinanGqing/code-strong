import { Router } from 'express';
import { getDatabase, saveDatabase } from '../db/database.js';
import { sendVerificationCode } from '../utils/email.js';

const router = Router();

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function isPhone(v) { return /^1[3-9]\d{9}$/.test(v); }

function maskTarget(target) {
  if (isEmail(target)) {
    const [name, domain] = target.split('@');
    return name.length <= 2 ? `${name[0]}***@${domain}` : `${name[0]}***${name.slice(-1)}@${domain}`;
  }
  // 手机号：138****1234
  return target.slice(0, 3) + '****' + target.slice(-4);
}

/**
 * POST /api/verify/send-code
 * 发送验证码（支持邮箱和手机号）
 * Body: { email: string, type: 'register' | 'reset' }
 */
router.post('/send-code', (req, res) => {
  try {
    const { email, type } = req.body;
    const target = (email || '').trim().replace(/\s/g, '');

    if (!isEmail(target)) {
      return res.json({ code: 1, data: null, message: '请输入有效的邮箱地址' });
    }
    if (!['register', 'reset', 'change-email'].includes(type)) {
      return res.json({ code: 1, data: null, message: '无效的验证码类型' });
    }

    const db = getDatabase();

    // 注册时检查邮箱是否已被注册
    if (type === 'register') {
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(target);
      if (existing) {
        return res.json({ code: 1, data: null, message: '该邮箱已被注册' });
      }
    }

    // 重置密码时检查邮箱是否存在
    if (type === 'reset') {
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(target);
      if (!existing) {
        return res.json({ code: 1, data: null, message: '该邮箱未注册' });
      }
    }

    // 修改邮箱时检查新邮箱是否被占用
    if (type === 'change-email') {
      const exist = db.prepare('SELECT id FROM users WHERE email = ?').get(target);
      if (exist) return res.json({ code: 1, data: null, message: '该邮箱已被其他用户使用' });
    }

    // 60 秒内不能重复发送
    const recent = db.prepare(
      "SELECT created_at FROM verification_codes WHERE email = ? AND type = ? AND used = 0 ORDER BY id DESC LIMIT 1"
    ).get(target, type);

    if (recent) {
      const diff = Date.now() - new Date(recent.created_at + '+08:00').getTime();
      if (diff < 60000) {
        const seconds = Math.ceil((60000 - diff) / 1000);
        return res.json({ code: 1, data: null, message: `请 ${seconds} 秒后再发送` });
      }
    }

    const code = generateCode();
    const d = new Date(Date.now() + 5 * 60 * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    const expiresAt = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

    db.prepare(
      'INSERT INTO verification_codes (email, code, type, expires_at) VALUES (?, ?, ?, ?)'
    ).run(target, code, type, expiresAt);

    saveDatabase();

    // 发送邮件（非阻塞，失败不中断响应）
    sendVerificationCode(target, code, type).catch(err => {
      console.error('[Verify] sendVerificationCode error:', err.message);
    });

    return res.json({
      code: 0,
      data: { maskedEmail: maskTarget(target) },
      message: '验证码已发送，请查收邮件',
    });
  } catch (err) {
    console.error('[Verify] send-code error:', err);
    return res.status(500).json({ code: 500, data: null, message: '服务器内部错误' });
  }
});

export default router;

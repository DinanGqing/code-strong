import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase, saveDatabase } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * 解析 UID 并生成下一个
 * 规则: M001(保留) → M002 → ... → M999 → M0001 → M0002 → ... → M9999 → M00001 → ...
 */
function generateUid(db) {
  // 查找最后分配的 UID
  const last = db.prepare(
    "SELECT uid FROM users WHERE uid IS NOT NULL AND uid != 'M001' ORDER BY LENGTH(uid) DESC, uid DESC LIMIT 1"
  ).get();

  if (!last || !last.uid) return 'M002'; // 第一个用户（M001 永久保留）

  const lastUid = last.uid;
  const numPart = lastUid.slice(1); // 去掉 "M"
  const width = numPart.length;
  const num = parseInt(numPart, 10);

  // 到达当前位数的最大值（全 9），则进位加宽
  if (num === Math.pow(10, width) - 1) {
    const newWidth = width + 1;
    return 'M' + '1'.padStart(newWidth, '0');
  }

  // 普通递增
  return 'M' + String(num + 1).padStart(width, '0');
}

function verifyCode(db, email, code, type) {
  const record = db.prepare(
    `SELECT * FROM verification_codes 
     WHERE email = ? AND code = ? AND type = ? AND used = 0 
     AND expires_at > datetime('now', 'localtime')
     ORDER BY id DESC LIMIT 1`
  ).get(email, code, type);
  if (!record) return false;
  db.prepare('UPDATE verification_codes SET used = 1 WHERE id = ?').run(record.id);
  return true;
}

/**
 * POST /api/auth/register
 * 用户注册（邮箱 + 验证码）
 * 用户名允许重复，系统自动生成唯一 UID
 * Body: { username, email, password, code }
 */
router.post('/register', (req, res) => {
  try {
    const { username, email, password, code } = req.body;

    if (!username || !username.trim()) {
      return res.json({ code: 1, data: null, message: '昵称不能为空' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.json({ code: 1, data: null, message: '请输入有效的邮箱地址' });
    }
    if (!password || password.length < 6) {
      return res.json({ code: 1, data: null, message: '密码至少6位' });
    }
    if (!code || code.length !== 6) {
      return res.json({ code: 1, data: null, message: '请输入6位验证码' });
    }

    const db = getDatabase();

    // 只检查邮箱唯一性，用户名允许重复
    const exist = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim());
    if (exist) {
      return res.json({ code: 1, data: null, message: '该邮箱已被注册' });
    }

    if (!verifyCode(db, email.trim(), code, 'register')) {
      return res.json({ code: 1, data: null, message: '验证码错误或已过期' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const uid = generateUid(db);
    const result = db.prepare(
      'INSERT INTO users (username, email, password_hash, uid, verified) VALUES (?, ?, ?, ?, 1)'
    ).run(username.trim(), email.trim(), passwordHash, uid);

    saveDatabase();

    const token = jwt.sign(
      { id: uid, username: username.trim() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      code: 0,
      data: {
        token,
        user: { id: uid, uid, username: username.trim(), email: email.trim() },
      },
      message: '注册成功',
    });
  } catch (err) {
    console.error('[Auth] register error:', err);
    return res.status(500).json({ code: 500, data: null, message: '服务器内部错误' });
  }
});

/**
 * POST /api/auth/create-test-user （管理接口，仅localhost可调用）
 * Body: { username, email, password, uid? }
 */
router.post('/create-test-user', (req, res) => {
  try {
    // 仅服务器本地可调用
    const clientIp = req.ip || req.connection.remoteAddress;
    if (clientIp !== '127.0.0.1' && clientIp !== '::1' && clientIp !== '::ffff:127.0.0.1') {
      return res.status(403).json({ code: 403, message: '仅服务器本地可调用' });
    }

    const { username, email, password, uid } = req.body;
    if (!username || !email || !password) {
      return res.json({ code: 1, message: '缺少必要字段' });
    }

    const db = getDatabase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email.trim(), username.trim());
    if (existing) {
      return res.json({ code: 1, message: '用户已存在' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const finalUid = uid || generateUid(db);
    db.prepare(
      'INSERT INTO users (username, email, password_hash, uid, verified) VALUES (?, ?, ?, ?, 1)'
    ).run(username.trim(), email.trim(), passwordHash, finalUid);

    saveDatabase();
    return res.json({ code: 0, data: { uid: finalUid, username: username.trim() }, message: '创建成功' });
  } catch (err) {
    console.error('[Auth] create-test-user error:', err);
    return res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * POST /api/auth/login
 * 用户登录：支持用户名 / 邮箱 / UID + 密码
 * Body: { username, password }
 */
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !username.trim()) {
      return res.json({ code: 1, data: null, message: '请输入用户名/邮箱/UID' });
    }
    if (!password) {
      return res.json({ code: 1, data: null, message: '密码不能为空' });
    }

    const input = username.trim();
    const db = getDatabase();

    // 识别：纯数字 → id，M开头 → uid列，含@ → 邮箱
    let user;
    if (input.startsWith('M') || input.startsWith('m')) {
      user = db.prepare('SELECT * FROM users WHERE uid = ?').get(input.toUpperCase());
    } else if (/^\d+$/.test(input)) {
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(parseInt(input));
    } else if (input.includes('@')) {
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(input);
    } else {
      return res.json({ code: 1, data: null, message: '请使用邮箱或UID登录' });
    }

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.json({ code: 1, data: null, message: '账号或密码错误' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 记录登录日志（含客户端 IP）
    const clientIp = req.ip || req.connection?.remoteAddress || '未知';
    db.prepare('INSERT INTO login_logs (user_id, ip) VALUES (?, ?)').run(user.id, clientIp);
    db.prepare('UPDATE users SET last_login = datetime(\'now\',\'localtime\') WHERE id = ?').run(user.id);
    saveDatabase();

    return res.json({
      code: 0,
      data: {
        token,
        user: {
          id: user.id, uid: user.uid,
          username: user.username, email: user.email,
          avatar: user.avatar, bio: user.bio, created_at: user.created_at,
        },
      },
      message: '登录成功',
    });
  } catch (err) {
    console.error('[Auth] login error:', err);
    return res.status(500).json({ code: 500, data: null, message: '服务器内部错误' });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', authMiddleware, (req, res) => {
  try {
    const db = getDatabase();
    const user = db.prepare(
      'SELECT id, username, email, phone, avatar, bio, created_at FROM users WHERE id = ?'
    ).get(req.user.id);
    if (!user) return res.json({ code: 1, data: null, message: '用户不存在' });
    return res.json({ code: 0, data: { user: { ...user, uid: user.id } }, message: 'ok' });
  } catch (err) {
    console.error('[Auth] me error:', err);
    return res.status(500).json({ code: 500, data: null, message: '服务器内部错误' });
  }
});

/**
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.json({ code: 1, data: null, message: '请输入有效的邮箱地址' });
    }
    const db = getDatabase();
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim());
    if (!user) return res.json({ code: 1, data: null, message: '该邮箱未注册' });

    const recent = db.prepare(
      "SELECT created_at FROM verification_codes WHERE email = ? AND type = 'reset' AND used = 0 ORDER BY id DESC LIMIT 1"
    ).get(email.trim());
    if (recent) {
      const diff = Date.now() - new Date(recent.created_at + '+08:00').getTime();
      if (diff < 60000) {
        return res.json({ code: 1, data: null, message: `请 ${Math.ceil((60000 - diff) / 1000)} 秒后再发送` });
      }
    }

    import('../utils/email.js').then(async ({ sendVerificationCode }) => {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const d = new Date(Date.now() + 5 * 60 * 1000);
      const pad = (n) => String(n).padStart(2, '0');
      const expiresAt = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      db.prepare("INSERT INTO verification_codes (email, code, type, expires_at) VALUES (?, ?, 'reset', ?)")
        .run(email.trim(), code, expiresAt);
      saveDatabase();
      await sendVerificationCode(email.trim(), code, 'reset');
      const masked = email.trim().replace(/(.{2}).*(@.*)/, '$1***$2');
      return res.json({ code: 0, data: { maskedEmail: masked }, message: '验证码已发送，请查收邮件' });
    });
  } catch (err) {
    console.error('[Auth] forgot-password error:', err);
    return res.status(500).json({ code: 500, data: null, message: '服务器内部错误' });
  }
});

/**
 * POST /api/auth/reset-password
 */
router.post('/reset-password', (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.json({ code: 1, data: null, message: '请输入有效的邮箱地址' });
    }
    if (!code || code.length !== 6) return res.json({ code: 1, data: null, message: '请输入6位验证码' });
    if (!newPassword || newPassword.length < 6) return res.json({ code: 1, data: null, message: '新密码至少6位' });

    const db = getDatabase();
    if (!verifyCode(db, email.trim(), code, 'reset')) {
      return res.json({ code: 1, data: null, message: '验证码错误或已过期' });
    }
    db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(bcrypt.hashSync(newPassword, 10), email.trim());
    saveDatabase();
    return res.json({ code: 0, data: null, message: '密码重置成功，请重新登录' });
  } catch (err) {
    console.error('[Auth] reset-password error:', err);
    return res.status(500).json({ code: 500, data: null, message: '服务器内部错误' });
  }
});

/**
 * PUT /api/auth/profile
 * 修改个人资料（昵称/邮箱/头像/签名）
 */
router.put('/profile', authMiddleware, (req, res) => {
  try {
    const { username, email, avatar, bio } = req.body;
    const db = getDatabase();
    const userId = req.user.id;

    if (username !== undefined && (!username || !username.trim())) {
      return res.json({ code: 1, data: null, message: '昵称不能为空' });
    }
    if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.json({ code: 1, data: null, message: '邮箱格式不正确' });
    }

    // 检查邮箱唯一性（排除自己）
    if (email) {
      const exist = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.trim(), userId);
      if (exist) return res.json({ code: 1, data: null, message: '该邮箱已被其他用户使用' });
    }

    const updates = [], params = [];
    if (username !== undefined) { updates.push('username = ?'); params.push(username.trim()); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email.trim()); }
    if (avatar !== undefined) { updates.push('avatar = ?'); params.push(avatar); }
    if (bio !== undefined) { updates.push('bio = ?'); params.push(bio); }

    if (updates.length === 0) {
      return res.json({ code: 1, data: null, message: '没有要修改的内容' });
    }

    params.push(userId);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    saveDatabase();

    const updated = db.prepare('SELECT id, uid, username, email, avatar, bio FROM users WHERE id = ?').get(userId);
    return res.json({ code: 0, data: { user: updated }, message: '资料更新成功' });
  } catch (err) {
    console.error('[Auth] profile error:', err);
    return res.status(500).json({ code: 500, data: null, message: '服务器内部错误' });
  }
});

/**
 * GET /api/auth/stats
 * 获取账户统计（活跃天数、最近访问记录）
 */
router.get('/stats', authMiddleware, (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;

    // 活跃天数 = 不同日期的登录次数
    const activeDays = db.prepare(
      'SELECT COUNT(DISTINCT DATE(login_at)) as days FROM login_logs WHERE user_id = ?'
    ).get(userId);

    // 最近 5 条访问记录
    const recentLogs = db.prepare(
      'SELECT login_at, ip FROM login_logs WHERE user_id = ? ORDER BY id DESC LIMIT 5'
    ).all(userId);

    return res.json({
      code: 0,
      data: {
        activeDays: activeDays?.days || 0,
        recentLogs: recentLogs.map(l => ({ time: l.login_at, ip: l.ip || '未知' })),
      },
      message: 'ok',
    });
  } catch (err) {
    console.error('[Auth] stats error:', err);
    return res.status(500).json({ code: 500, data: null, message: '服务器内部错误' });
  }
});

/**
 * POST /api/auth/change-email
 * 修改邮箱（需新邮箱验证码）
 * Body: { newEmail, code }
 */
router.post('/change-email', authMiddleware, (req, res) => {
  try {
    const { newEmail, code } = req.body;
    const db = getDatabase();
    const userId = req.user.id;

    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return res.json({ code: 1, data: null, message: '请输入有效的新邮箱' });
    }
    if (!code || code.length !== 6) {
      return res.json({ code: 1, data: null, message: '请输入6位验证码' });
    }

    // 检查新邮箱是否已被占用
    const exist = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(newEmail.trim(), userId);
    if (exist) return res.json({ code: 1, data: null, message: '该邮箱已被其他用户使用' });

    // 验证验证码
    if (!verifyCode(db, newEmail.trim(), code, 'change-email')) {
      return res.json({ code: 1, data: null, message: '验证码错误或已过期' });
    }

    db.prepare('UPDATE users SET email = ? WHERE id = ?').run(newEmail.trim(), userId);
    saveDatabase();

    return res.json({ code: 0, data: { email: newEmail.trim() }, message: '邮箱修改成功' });
  } catch (err) {
    console.error('[Auth] change-email error:', err);
    return res.status(500).json({ code: 500, data: null, message: '服务器内部错误' });
  }
});

/**
 * DELETE /api/auth/account
 * 注销账号：删除用户全部数据
 * 需要二次确认（body 传入 confirm 字段）
 */
router.delete('/account', authMiddleware, (req, res) => {
  try {
    const { confirmCode } = req.body;
    const db = getDatabase();
    const userId = req.user.id;

    // 二次确认：前端传入当前登录用户名作为确认码
    const user = db.prepare('SELECT username FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.json({ code: 1, data: null, message: '用户不存在' });
    }

    // 要求用户输入自己的昵称作为确认
    if (!confirmCode || confirmCode.trim() !== user.username) {
      return res.json({ code: 1, data: null, message: '昵称不匹配，未执行注销' });
    }

    // 删除关联数据
    db.prepare('DELETE FROM login_logs WHERE user_id = ?').run(userId);
    db.prepare("UPDATE community_activities SET username = '[已注销]' WHERE username = ?").run(user.username);
    db.prepare('DELETE FROM verification_codes WHERE email = (SELECT email FROM users WHERE id = ?)').run(userId);
    // tools 的 author_id 外键设为 NULL（保留工具不删）
    db.prepare('UPDATE tools SET author_id = NULL WHERE author_id = ?').run(userId);

    // 删除用户
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    saveDatabase();

    console.log(`[Auth] 用户已注销: ${user.username} (id=${userId})`);
    return res.json({ code: 0, data: null, message: `账号「${user.username}」已注销，感谢你的陪伴` });
  } catch (err) {
    console.error('[Auth] delete-account error:', err);
    return res.status(500).json({ code: 500, data: null, message: '服务器内部错误' });
  }
});

export default router;

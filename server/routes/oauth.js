import { Router } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { getDatabase, saveDatabase } from '../db/database.js';

function generateUid(db) {
  const last = db.prepare(
    "SELECT uid FROM users WHERE uid IS NOT NULL AND uid != 'M001' ORDER BY LENGTH(uid) DESC, uid DESC LIMIT 1"
  ).get();
  if (!last || !last.uid) return 'M002';
  const numPart = last.uid.slice(1);
  const width = numPart.length;
  const num = parseInt(numPart, 10);
  if (num === Math.pow(10, width) - 1) {
    return 'M' + '1'.padStart(width + 1, '0');
  }
  return 'M' + String(num + 1).padStart(width, '0');
}

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'codestrong-secret-2024';
const BASE_URL = process.env.BASE_URL || 'http://bitopen.online';
const REDIRECT_QQ = `${BASE_URL}/api/oauth/qq/callback`;

// ====== QQ OAuth ======

// 获取 QQ 授权 URL（支持 login / bind 两种模式）
router.get('/qq/url', (req, res) => {
  const appId = process.env.QQ_APPID;
  const mode = req.query.mode || 'login';
  const redirectUri = encodeURIComponent(`${BASE_URL}/api/oauth/qq/callback`);
  const state = `${mode}_${Math.random().toString(36).substring(2)}`;
  const url = `https://graph.qq.com/oauth2.0/authorize?response_type=code&client_id=${appId}&redirect_uri=${redirectUri}&state=${state}&scope=get_user_info`;
  res.json({ code: 0, data: { url, state } });
});

// QQ 回调（同时处理 login 和 bind 两种模式）
router.get('/qq/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) return res.status(400).send('缺少 code');

  // 从 state 解析模式
  const mode = state?.startsWith('bind_') ? 'bind' : 'login';

  try {
    // 用 code 换 access_token
    const tokenRes = await axios.get('https://graph.qq.com/oauth2.0/token', {
      params: {
        grant_type: 'authorization_code',
        client_id: process.env.QQ_APPID,
        client_secret: process.env.QQ_SECRET,
        code,
        redirect_uri: REDIRECT_QQ,
      },
    });
    const params = new URLSearchParams(tokenRes.data);
    const accessToken = params.get('access_token');

    // 获取 openid
    const openidRes = await axios.get(`https://graph.qq.com/oauth2.0/me?access_token=${accessToken}`);
    const jsonStr = openidRes.data.match(/callback\((.*)\)/)?.[1];
    const { openid } = JSON.parse(jsonStr);

    // 获取用户信息（QQ昵称+头像，供展示用）
    const userRes = await axios.get('https://graph.qq.com/user/get_user_info', {
      params: { access_token: accessToken, oauth_consumer_key: process.env.QQ_APPID, openid },
    });
    const qqUser = userRes.data;
    const qqNickname = qqUser.nickname || 'QQ用户';
    const qqAvatar = qqUser.figureurl_qq_2 || qqUser.figureurl_qq_1 || '';

    const db = getDatabase();

    if (mode === 'bind') {
      // ====== 绑定模式：不登录，只返回 openid 给前端，由前端调 bind API ======
      // 前端回调页面收到后，调用 POST /api/oauth/qq/bind 把 openid 绑定到当前用户
      const redirectParams = new URLSearchParams({
        mode: 'bind',
        openid,
        qq_nickname: qqNickname,
        qq_avatar: qqAvatar,
      });
      res.redirect(`${BASE_URL}/#/oauth/callback?${redirectParams.toString()}`);
    } else {
      // ====== 登录模式：查找已绑定的用户，不自动创建 ======
      // 确保 qq_openid 列存在
      try { db.exec('ALTER TABLE users ADD COLUMN qq_openid TEXT'); } catch {}

      const user = db.prepare('SELECT id, username, uid, avatar, email FROM users WHERE qq_openid = ?').get(openid);
      if (!user) {
        // 未绑定，重定向到首页并附带错误信息
        const errorParams = new URLSearchParams({ oauth_error: 'qq_not_bound', qq_nickname: qqNickname });
        res.redirect(`${BASE_URL}/#/?${errorParams.toString()}`);
        return;
      }

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      res.redirect(`${BASE_URL}/#/oauth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
    }
  } catch (e) {
    console.error('QQ OAuth error:', e.message);
    res.status(500).send('QQ登录失败');
  }
});

// 绑定 QQ 到当前登录用户
router.post('/qq/bind', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.json({ code: -1, message: '未登录' });

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    const { openid, qq_nickname } = req.body;
    if (!openid) return res.json({ code: -1, message: '缺少 openid' });

    const db = getDatabase();
    try { db.exec('ALTER TABLE users ADD COLUMN qq_openid TEXT'); } catch {}

    // 检查 openid 是否已被其他账号绑定
    const existing = db.prepare('SELECT id, username FROM users WHERE qq_openid = ? AND id != ?').get(openid, userId);
    if (existing) {
      return res.json({ code: -1, message: '该 QQ 账号已被其他用户绑定' });
    }

    db.prepare('UPDATE users SET qq_openid = ? WHERE id = ?').run(openid, userId);
    saveDatabase();

    return res.json({ code: 0, message: 'QQ 绑定成功', data: { qq_nickname } });
  } catch (e) {
    console.error('QQ bind error:', e.message);
    return res.json({ code: -1, message: '绑定失败' });
  }
});

// 解绑 QQ
router.post('/qq/unbind', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.json({ code: -1, message: '未登录' });

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    const db = getDatabase();
    db.prepare('UPDATE users SET qq_openid = NULL WHERE id = ?').run(userId);
    saveDatabase();

    return res.json({ code: 0, message: 'QQ 解绑成功' });
  } catch (e) {
    console.error('QQ unbind error:', e.message);
    return res.json({ code: -1, message: '解绑失败' });
  }
});

// 查询当前用户的 QQ 绑定状态
router.get('/qq/status', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.json({ code: -1, message: '未登录' });

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    const db = getDatabase();
    const user = db.prepare('SELECT qq_openid FROM users WHERE id = ?').get(userId);

    return res.json({
      code: 0,
      data: {
        bound: !!(user?.qq_openid),
      },
    });
  } catch (e) {
    return res.json({ code: -1, message: '查询失败' });
  }
});

export default router;

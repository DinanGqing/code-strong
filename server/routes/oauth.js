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

/**
 * 从 QQ 的 JSONP 格式响应中安全提取 JSON 对象
 * QQ API 的响应格式如：callback( {"key":"value"} );
 */
function extractQQJson(raw) {
  if (!raw) return null;
  const m = String(raw).match(/callback\(\s*(\{.*\})\s*\)/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

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

/**
 * QQ 回调（同时处理 login 和 bind 两种模式）
 *
 * 流程：
 * 1. QQ 授权后重定向到此，携带 code + state
 * 2. 用 code 换 access_token
 * 3. 用 access_token 换 openid
 * 4. 获取用户信息（昵称、头像）
 * 5. bind 模式 → 重定向到前端回调页，由前端调 bind API
 * 6. login 模式 → 查找绑定用户，生成 JWT，重定向
 */
router.get('/qq/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) return res.status(400).send('缺少 code');

  const mode = state?.startsWith('bind_') ? 'bind' : 'login';
  console.log(`[QQ Callback] mode=${mode} code=${code?.substring(0, 8)}... state=${state}`);

  // 统一错误重定向：不管是哪个步骤失败，都跳转到前端
  const redirectError = (msg) => {
    console.error(`[QQ Callback Error] ${msg}`);
    if (mode === 'bind') {
      res.redirect(`${BASE_URL}/#/oauth/callback?mode=bind&error=${encodeURIComponent(msg)}`);
    } else {
      const errParams = new URLSearchParams({ oauth_error: msg });
      res.redirect(`${BASE_URL}/#/?${errParams.toString()}`);
    }
  };

  try {
    // ====== 第 1 步：用 code 换 access_token ======
    const tokenRes = await axios.get('https://graph.qq.com/oauth2.0/token', {
      params: {
        grant_type: 'authorization_code',
        client_id: process.env.QQ_APPID,
        client_secret: process.env.QQ_SECRET,
        code,
        redirect_uri: REDIRECT_QQ,
      },
      timeout: 10000,
    });

    // QQ 的 token 响应可能是 URL 编码格式 (access_token=xxx&expires_in=xxx)
    // 也可能是 JSONP 格式 (callback({"error":100005,...}))
    const tokenRaw = tokenRes.data;
    if (!tokenRaw) return redirectError('QQ 授权失败：空响应');

    let accessToken = null;
    if (typeof tokenRaw === 'string' && tokenRaw.includes('access_token=')) {
      // URL 编码格式
      const tp = new URLSearchParams(tokenRaw);
      accessToken = tp.get('access_token');
    } else if (typeof tokenRaw === 'string' && tokenRaw.includes('callback(')) {
      // JSONP 格式（错误情况）
      const json = extractQQJson(tokenRaw);
      if (json && json.error) {
        return redirectError(`QQ 授权失败：${json.error_description || json.error}`);
      }
    }

    if (!accessToken) return redirectError('QQ 授权失败：无法获取 access_token');

    // ====== 第 2 步：用 access_token 获取 openid ======
    const openidRes = await axios.get('https://graph.qq.com/oauth2.0/me', {
      params: { access_token: accessToken },
      timeout: 10000,
    });

    const openidRaw = openidRes.data;
    if (!openidRaw) return redirectError('QQ 登录失败：无法获取用户标识');

    const openidJson = extractQQJson(openidRaw);
    if (!openidJson || !openidJson.openid) {
      return redirectError('QQ 登录失败：无效的用户标识');
    }
    const openid = openidJson.openid;
    if (typeof openid !== 'string' || openid.length < 4) {
      return redirectError('QQ 登录失败：用户标识格式异常');
    }

    // ====== 第 3 步：获取用户信息（昵称、头像） ======
    let qqNickname = 'QQ用户';
    let qqAvatar = '';
    try {
      const userRes = await axios.get('https://graph.qq.com/user/get_user_info', {
        params: { access_token: accessToken, oauth_consumer_key: process.env.QQ_APPID, openid },
        timeout: 10000,
      });
      const qqUser = userRes.data;
      if (qqUser && qqUser.ret === 0) {
        qqNickname = qqUser.nickname || 'QQ用户';
        qqAvatar = qqUser.figureurl_qq_2 || qqUser.figureurl_qq_1 || '';
      }
    } catch (e) {
      console.warn('[QQ] get_user_info failed, using defaults:', e.message);
    }

    const db = getDatabase();

    // ====== 第 4 步：按模式处理 ======
    if (mode === 'bind') {
      // ====== 绑定模式 ======
      // 只传必要的参数，避免 URL 过长
      const redirectParams = new URLSearchParams({
        mode: 'bind',
        openid,
        qq_nickname: qqNickname,
      });
      res.redirect(`${BASE_URL}/#/oauth/callback?${redirectParams.toString()}`);
    } else {
      // ====== 登录模式 ======
      // 确保 qq_openid 列存在
      try { db.exec('ALTER TABLE users ADD COLUMN qq_openid TEXT'); } catch {}

      const user = db.prepare('SELECT id, username, uid, avatar, email FROM users WHERE qq_openid = ?').get(openid);
      if (!user) {
        const errorParams = new URLSearchParams({ oauth_error: 'qq_not_bound', qq_nickname: qqNickname });
        res.redirect(`${BASE_URL}/#/?${errorParams.toString()}`);
        return;
      }

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      res.redirect(`${BASE_URL}/#/oauth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
    }
  } catch (e) {
    console.error('[QQ OAuth Error]', e.message, e.stack?.substring(0, 200));
    redirectError('QQ 登录失败');
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

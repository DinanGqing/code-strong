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
const REDIRECT_WECHAT = `${BASE_URL}/api/oauth/wechat/callback`;

// ====== 微信 OAuth ======
// 网页扫码 & App 共用
router.get('/wechat/url', (req, res) => {
  const appId = process.env.WECHAT_APPID;
  const redirectUri = encodeURIComponent(REDIRECT_WECHAT);
  const state = Math.random().toString(36).substring(2);
  const url = `https://open.weixin.qq.com/connect/qrconnect?appid=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`;
  res.json({ code: 0, data: { url, state } });
});

// 微信回调
router.get('/wechat/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) return res.status(400).send('缺少 code');

  try {
    // 用 code 换 access_token
    const tokenRes = await axios.get('https://api.weixin.qq.com/sns/oauth2/access_token', {
      params: {
        appid: process.env.WECHAT_APPID,
        secret: process.env.WECHAT_SECRET,
        code,
        grant_type: 'authorization_code',
      },
    });
    const { access_token, openid, unionid } = tokenRes.data;

    // 获取用户信息
    const userRes = await axios.get('https://api.weixin.qq.com/sns/userinfo', {
      params: { access_token, openid },
    });
    const wxUser = userRes.data;

    // 查找或创建用户
    const db = getDatabase();
    let user = db.prepare('SELECT * FROM users WHERE wx_openid = ?').get(openid);
    if (!user) {
      const id = Date.now().toString(36);
      db.prepare(
        'INSERT INTO users (id, username, nickname, avatar, wx_openid, wx_unionid) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(id, `wx_${openid}`, wxUser.nickname, wxUser.headimgurl, openid, unionid);
      user = { id, username: `wx_${openid}`, nickname: wxUser.nickname, avatar: wxUser.headimgurl };
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    // 重定向到前端回调页
    res.redirect(`${BASE_URL}/#/oauth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
  } catch (e) {
    console.error('WeChat OAuth error:', e.message);
    res.status(500).send('微信登录失败');
  }
});

// ====== QQ OAuth ======
router.get('/qq/url', (req, res) => {
  const appId = process.env.QQ_APPID;
  const redirectUri = encodeURIComponent(`${BASE_URL}/api/oauth/qq/callback`);
  const state = Math.random().toString(36).substring(2);
  const url = `https://graph.qq.com/oauth2.0/authorize?response_type=code&client_id=${appId}&redirect_uri=${redirectUri}&state=${state}&scope=get_user_info`;
  res.json({ code: 0, data: { url, state } });
});

// QQ 回调
router.get('/qq/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) return res.status(400).send('缺少 code');

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
    const { openid, unionid } = JSON.parse(jsonStr);

    // 获取用户信息
    const userRes = await axios.get('https://graph.qq.com/user/get_user_info', {
      params: { access_token: accessToken, oauth_consumer_key: process.env.QQ_APPID, openid },
    });
    const qqUser = userRes.data;

    // 确保 qq_openid 列存在
    try { db.exec('ALTER TABLE users ADD COLUMN qq_openid TEXT'); } catch {}

    // 查找或创建用户
    const db = getDatabase();
    let user = db.prepare('SELECT id, username, uid, avatar FROM users WHERE qq_openid = ?').get(openid);
    if (!user) {
      // 生成唯一用户名
      let nickname = qqUser.nickname || 'QQ用户';
      const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(nickname);
      const finalUsername = exists ? `${nickname}_${openid.slice(-4)}` : nickname;

      const stmt = db.prepare(
        'INSERT INTO users (username, email, password_hash, avatar, bio, qq_openid, verified) VALUES (?, ?, ?, ?, ?, ?, 1)'
      );
      stmt.run(finalUsername, null, '', qqUser.figureurl_qq_2 || qqUser.figureurl_qq_1, '', openid);

      // 分配 UID
      const uid = generateUid(db);
      const newId = db.prepare('SELECT last_insert_rowid() AS id').get().id;
      db.prepare('UPDATE users SET uid = ? WHERE id = ?').run(uid, newId);
      saveDatabase();

      user = { id: newId, username: finalUsername, uid, avatar: qqUser.figureurl_qq_2 };
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.redirect(`${BASE_URL}/#/oauth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({ ...user, avatar: user.avatar }))}`);
  } catch (e) {
    console.error('QQ OAuth error:', e.message);
    res.status(500).send('QQ登录失败');
  }
});

export default router;
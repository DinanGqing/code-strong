import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db/database.js';
import { runSeed } from './db/seed.js';
import authRoutes from './routes/auth.js';
import toolsRoutes from './routes/tools.js';
import communityRoutes from './routes/community.js';
import aiRoutes from './routes/ai.js';
import verifyRoutes from './routes/verify.js';
import uploadRoutes from './routes/upload.js';
import oauthRoutes from './routes/oauth.js';
import feedbackRoutes from './routes/feedback.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, '..', 'dist');

const app = express();
const PORT = process.env.PORT || 3001;

// 异步启动
async function start() {
  // 初始化数据库
  await initDatabase();

  // 执行种子数据填充
  runSeed();

  // 中间件
  // 请求日志
  app.use(function(req, _res, next) {
    console.log("[" + new Date().toISOString() + "] " + req.method + " " + req.url + " | UA: " + (req.headers["user-agent"] || "").substring(0, 60));
    next();
  });
  app.use(cors());
  app.use(express.json());

  // 路由挂载
  app.use('/api/auth', authRoutes);
  app.use('/api/tools', toolsRoutes);
  app.use('/api/community', communityRoutes);

  // AI 聊天路由（需登录）
  app.use('/api/ai', aiRoutes);

  // 邮箱验证码路由
  app.use('/api/verify', verifyRoutes);

  // 文件上传路由
  app.use('/api/upload', uploadRoutes);

  // OAuth 第三方登录路由
  app.use('/api/oauth', oauthRoutes);

  // 用户反馈/举报路由
  app.use('/api/feedback', feedbackRoutes);

  // 健康检查
  app.get('/api/health', (_req, res) => {
    res.json({ code: 0, data: { status: 'ok' }, message: '服务运行正常' });
  });

  // 禁止缓存（微信X5内核会缓存旧版HTML/JS）
  app.use(function(_req, res, next) {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
    next();
  });

  // 托管前端静态文件（生产模式，无需单独启动 vite）
  // index:false + redirect:false 阻止子目录接管 SPA 路由
  app.use(express.static(DIST_DIR, { index: false, redirect: false }));

  // 根路径单独处理
  app.get('/', (_req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });

  // 托管上传文件
  app.use('/uploads', express.static(path.join(DIST_DIR, 'uploads')));

  // SPA 回退：非 API 路由全部返回 index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });

  // 全局错误处理
  app.use((err, _req, res, _next) => {
    console.error('[Error]', err);
    res.status(500).json({
      code: 500,
      data: null,
      message: err.message || '服务器内部错误',
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] 智码圈已启动（前端+后端统一端口）: http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('[Server] 启动失败:', err);
  process.exit(1);
});

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth.js';
import { getDatabase, saveDatabase } from '../db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'dist', 'uploads', 'avatars');

// 确保目录存在
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `avatar_${req.user.id}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

const router = Router();

/**
 * POST /api/upload/avatar
 * 上传头像（需登录）
 */
router.post('/avatar', authMiddleware, upload.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.json({ code: 1, data: null, message: '请选择图片文件（png/jpg/gif/webp，最大2MB）' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const db = getDatabase();
    db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatarUrl, req.user.id);
    saveDatabase();

    return res.json({ code: 0, data: { avatarUrl }, message: '头像上传成功' });
  } catch (err) {
    console.error('[Upload] avatar error:', err);
    return res.status(500).json({ code: 500, data: null, message: '上传失败' });
  }
});

export default router;

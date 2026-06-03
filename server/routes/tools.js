import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getDatabase, saveDatabase } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// 配置文件上传
const UPLOADS_DIR = path.join(process.cwd(), 'dist', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `tool-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB

/**
 * GET /api/tools
 * 返回工具列表，支持 category 查询参数过滤
 */
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const { category } = req.query;

    let sql = `
      SELECT
        t.id, t.name, t.description, t.category, t.tags,
        t.download_count, t.created_at, t.updated_at,
        u.username AS author_username,
        u.avatar AS author_avatar
      FROM tools t
      LEFT JOIN users u ON t.author_id = u.id
    `;

    let rows;

    if (category) {
      sql += ' WHERE t.category = ?';
      rows = db.prepare(sql).all(category);
    } else {
      rows = db.prepare(sql).all();
    }

    // 按下载量降序排列
    rows.sort((a, b) => (b.download_count || 0) - (a.download_count || 0));

    // 将原始数据转换为前端期望的格式
    const tools = rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      tags: JSON.parse(row.tags || '[]'),
      downloads: row.download_count,
      download_count: row.download_count,
      author: row.author_username || '未知用户',
      author_avatar: row.author_avatar,
      created_at: row.created_at,
      updated_at: row.updated_at,
      updatedAt: row.updated_at,
    }));

    return res.json({
      code: 0,
      data: { tools },
      message: 'ok',
    });
  } catch (err) {
    console.error('[Tools] list error:', err);
    return res.status(500).json({ code: 500, data: null, message: '服务器内部错误' });
  }
});

/**
 * POST /api/tools
 * 上传新工具（需 JWT 认证，支持文件上传）
 * Body (multipart/form-data): name, description, category, tags, file
 */
router.post('/', authMiddleware, upload.single('file'), (req, res) => {
  try {
    const { name, description, category, tags } = req.body;

    // 参数校验
    if (!name || !name.trim()) {
      return res.json({ code: 1, data: null, message: '工具名称不能为空' });
    }
    if (!description || !description.trim()) {
      return res.json({ code: 1, data: null, message: '工具描述不能为空' });
    }

    const db = getDatabase();

    let tagsArray = [];
    try {
      tagsArray = typeof tags === 'string' ? JSON.parse(tags) : (Array.isArray(tags) ? tags : []);
    } catch {
      tagsArray = typeof tags === 'string' && tags.trim()
        ? tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
    }

    const result = db.prepare(`
      INSERT INTO tools (name, description, category, tags, author_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      description.trim(),
      category || '其他',
      JSON.stringify(tagsArray),
      req.user.id
    );

    // 保存文件路径到工具记录（如果有文件）
    if (req.file) {
      db.prepare('UPDATE tools SET description = description || ? WHERE id = ?')
        .run(`\n\n📎 下载: /uploads/${req.file.filename}`, result.lastInsertRowid);
    }

    // 同时插入社区动态
    db.prepare(`
      INSERT INTO community_activities (username, action, target, tag)
      VALUES (?, ?, ?, ?)
    `).run(req.user.username, '上传了工具', name.trim(), '工具上新');

    saveDatabase();

    return res.json({
      code: 0,
      data: {
        id: result.lastInsertRowid,
        name: name.trim(),
        description: description.trim(),
        category: category || '其他',
        tags: tagsArray,
      },
      message: '工具上传成功',
    });
  } catch (err) {
    console.error('[Tools] upload error:', err);
    return res.status(500).json({ code: 500, data: null, message: '服务器内部错误' });
  }
});

/**
 * POST /api/tools/:id/download
 * 下载计数 +1
 */
router.post('/:id/download', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const tool = db.prepare('SELECT id, name FROM tools WHERE id = ?').get(id);
    if (!tool) {
      return res.json({ code: 1, data: null, message: '工具不存在' });
    }

    db.prepare('UPDATE tools SET download_count = download_count + 1 WHERE id = ?').run(id);
    saveDatabase();

    const updated = db.prepare('SELECT download_count FROM tools WHERE id = ?').get(id);

    return res.json({
      code: 0,
      data: { download_count: updated.download_count },
      message: '下载成功',
    });
  } catch (err) {
    console.error('[Tools] download error:', err);
    return res.status(500).json({ code: 500, data: null, message: '服务器内部错误' });
  }
});

export default router;

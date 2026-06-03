import bcrypt from 'bcryptjs';
import { getDatabase } from './database.js';

/**
 * 执行种子数据填充（幂等：使用 INSERT OR IGNORE）
 */
export function runSeed() {
  const db = getDatabase();

  console.log('[Seed] 开始填充种子数据...');

  // 管理员用户 — UID: M001 永久保留，密码需首次登录后修改
  const passwordHash = bcrypt.hashSync('Zhimaquan@Admin2025', 10);
  db.prepare(`
    INSERT OR IGNORE INTO users (username, email, password_hash, uid, avatar, bio)
    VALUES (?, ?, ?, 'M001', ?, ?)
  `).run(
    'admin',
    'admin@codestrong.com',
    passwordHash,
    'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
    '智码圈社区管理员'
  );
  console.log('[Seed] 管理员 admin (UID: M001) 已就绪（仅保留管理员，不再填充假数据）');
  console.log('[Seed] 种子数据填充完成');
}

import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** 数据库文件路径 */
const DB_PATH = path.join(__dirname, '..', 'data.db');

/** @type {import('sql.js').Database} */
let db;

/**
 * 简单 Statement 封装，模拟 better-sqlite3 的 prepared statement API
 */
class Statement {
  /** @param {import('sql.js').Database} db */
  /** @param {string} sql */
  constructor(db, sql) {
    this._db = db;
    this._sql = sql;
  }

  /**
   * 执行 INSERT/UPDATE/DELETE
   * @param  {...any} params
   * @returns {{ changes: number, lastInsertRowid: number }}
   */
  run(...params) {
    this._db.run(this._sql, params);
    const result = this._db.exec('SELECT last_insert_rowid() AS id, changes() AS changes');
    const row = result[0]?.values[0];
    return {
      changes: row ? row[1] : 0,
      lastInsertRowid: row ? row[0] : 0,
    };
  }

  /**
   * 获取单行结果
   * @param  {...any} params
   * @returns {object|undefined}
   */
  get(...params) {
    const stmt = this._db.prepare(this._sql);
    if (params.length > 0) {
      stmt.bind(params);
    }
    let row = undefined;
    if (stmt.step()) {
      const columns = stmt.getColumnNames();
      const values = stmt.get();
      row = {};
      for (let i = 0; i < columns.length; i++) {
        row[columns[i]] = values[i];
      }
    }
    stmt.free();
    return row;
  }

  /**
   * 获取所有行结果
   * @param  {...any} params
   * @returns {object[]}
   */
  all(...params) {
    const stmt = this._db.prepare(this._sql);
    if (params.length > 0) {
      stmt.bind(params);
    }
    const rows = [];
    while (stmt.step()) {
      const columns = stmt.getColumnNames();
      const values = stmt.get();
      const row = {};
      for (let i = 0; i < columns.length; i++) {
        row[columns[i]] = values[i];
      }
      rows.push(row);
    }
    stmt.free();
    return rows;
  }
}

/**
 * 数据库包装器，提供类似 better-sqlite3 的 API
 */
class DatabaseWrapper {
  /** @param {import('sql.js').Database} sqlDb */
  constructor(sqlDb) {
    this._sqlDb = sqlDb;
  }

  /**
   * 创建 prepared statement
   * @param {string} sql
   * @returns {Statement}
   */
  prepare(sql) {
    return new Statement(this._sqlDb, sql);
  }

  /**
   * 执行原始 SQL（用于 CREATE TABLE 等 DDL）
   * @param {string} sql
   */
  exec(sql) {
    this._sqlDb.run(sql);
  }

  /**
   * 执行 PRAGMA
   * @param {string} pragma
   */
  pragma(pragma) {
    this._sqlDb.run(`PRAGMA ${pragma}`);
  }

  /**
   * 保存到文件
   */
  save() {
    const data = this._sqlDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

/**
 * 初始化数据库连接并创建表结构
 * @returns {Promise<DatabaseWrapper>} 数据库实例
 */
export async function initDatabase() {
  const SQL = await initSqlJs();

  // 如果已有数据库文件，则加载；否则创建新的
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new DatabaseWrapper(new SQL.Database(fileBuffer));
  } else {
    db = new DatabaseWrapper(new SQL.Database());
  }

  // 启用外键约束
  db.pragma('foreign_keys = ON');

  // 创建 users 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT DEFAULT '',
      verified INTEGER DEFAULT 0,
      avatar TEXT,
      bio TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // 创建 verification_codes 表（邮箱验证码）
  db.exec(`
    CREATE TABLE IF NOT EXISTS verification_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'register',
      used INTEGER DEFAULT 0,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // 创建 tools 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS tools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT,
      tags TEXT DEFAULT '[]',
      download_count INTEGER DEFAULT 0,
      author_id INTEGER,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (author_id) REFERENCES users(id)
    );
  `);

  // 创建 community_activities 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS community_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      action TEXT,
      target TEXT,
      tag TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  db.save();

  // 兼容旧数据库：添加新列（如果不存在）
  try { db.exec('ALTER TABLE users ADD COLUMN phone TEXT DEFAULT \'\''); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN verified INTEGER DEFAULT 0'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN uid TEXT'); } catch {}
  try { db.exec("ALTER TABLE users ADD COLUMN last_login TEXT"); } catch {}

  // 创建 login_logs 表（登录记录）
  db.exec(`
    CREATE TABLE IF NOT EXISTS login_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      login_at TEXT DEFAULT (datetime('now', 'localtime')),
      ip TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // ===== 社交系统表 =====
  // 好友申请表
  db.exec(`
    CREATE TABLE IF NOT EXISTS friend_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (from_user_id) REFERENCES users(id),
      FOREIGN KEY (to_user_id) REFERENCES users(id)
    );
  `);

  // 好友关系表
  db.exec(`
    CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      friend_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (friend_id) REFERENCES users(id)
    );
  `);

  // 私聊消息表
  db.exec(`
    CREATE TABLE IF NOT EXISTS private_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (from_user_id) REFERENCES users(id),
      FOREIGN KEY (to_user_id) REFERENCES users(id)
    );
  `);

  // 频道表
  db.exec(`
    CREATE TABLE IF NOT EXISTS channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      creator_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (creator_id) REFERENCES users(id)
    );
  `);

  // 频道成员表
  db.exec(`
    CREATE TABLE IF NOT EXISTS channel_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member',
      joined_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (channel_id) REFERENCES channels(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // 频道消息表
  db.exec(`
    CREATE TABLE IF NOT EXISTS channel_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (channel_id) REFERENCES channels(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  db.save();

  // 给没有 uid 的旧用户按 id 顺序分配 UID
  const needUid = db.prepare('SELECT id FROM users WHERE uid IS NULL ORDER BY id').all();
  if (needUid.length > 0) {
    console.log(`[DB] 为 ${needUid.length} 个旧用户分配 UID...`);
    // 跳过已保留的 M001，从已有最大 uid 之后开始
    const maxUid = db.prepare("SELECT uid FROM users WHERE uid IS NOT NULL AND uid != 'M001' ORDER BY LENGTH(uid) DESC, uid DESC LIMIT 1").get();
    let width = 3, counter = 1;
    if (maxUid?.uid) {
      const numPart = maxUid.uid.slice(1);
      width = numPart.length;
      counter = parseInt(numPart, 10);
    }
    for (const u of needUid) {
      if (counter === Math.pow(10, width) - 1) { width++; counter = 1; }
      else counter++;
      const newUid = 'M' + String(counter).padStart(width, '0');
      db.prepare('UPDATE users SET uid = ? WHERE id = ?').run(newUid, u.id);
    }
    db.save();
    console.log('[DB] 旧用户 UID 分配完成');
  }

  console.log('[DB] 数据库初始化完成');
  return db;
}

/**
 * 获取数据库实例
 * @returns {DatabaseWrapper}
 */
export function getDatabase() {
  if (!db) {
    throw new Error('数据库未初始化，请先调用 initDatabase()');
  }
  return db;
}

/**
 * 持久化数据库到文件
 */
export function saveDatabase() {
  if (db) {
    db.save();
  }
}

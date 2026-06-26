/**
 * 数据库初始化 — 使用 sql.js (WebAssembly) 替代 better-sqlite3
 * 无需原生编译，纯 JavaScript 实现
 */
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'sql-practice.db');

/** @type {import('sql.js').Database} */
let db = null;

/**
 * 异步初始化数据库
 * - 从磁盘加载已有数据库文件
 * - 若文件不存在则创建空数据库
 * - 自动建表
 */
async function initDatabase() {
  const SQL = await initSqlJs();

  // 确保 data 目录存在
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // 尝试加载已有数据库文件
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');

  initTables();
  saveDb(); // 若首次创建，立即持久化

  console.log(`[DB] 数据库已就绪: ${DB_PATH}`);
  return db;
}

/**
 * 获取数据库实例（同步，调用前需确保已初始化）
 */
function getDb() {
  if (!db) {
    throw new Error('数据库尚未初始化，请先调用 initDatabase()');
  }
  return db;
}

/**
 * 持久化数据库到磁盘
 * 每次写操作后调用
 */
function saveDb() {
  if (!db) return;
  const buffer = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(buffer));
}

/**
 * 执行单条 SQL（无返回值，用于 INSERT/UPDATE/DELETE/DDL）
 * 自动保存到磁盘
 */
function run(sql, params = []) {
  getDb().run(sql, params);
  saveDb();
}

/**
 * 执行查询并返回行对象数组 [{col: val, ...}]
 */
function queryAll(sql, params = []) {
  const d = getDb();
  // sql.js prepare + step pattern for parameterized queries
  const stmt = d.prepare(sql);
  if (params.length > 0) stmt.bind(params);

  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

/**
 * 执行查询并返回第一行，无结果则返回 undefined
 */
function queryOne(sql, params = []) {
  const d = getDb();
  const stmt = d.prepare(sql);
  if (params.length > 0) stmt.bind(params);

  let row;
  if (stmt.step()) {
    row = stmt.getAsObject();
  }
  stmt.free();
  return row;
}

/**
 * 执行 exec（支持多条 SQL，仅用于 DDL 初始化）
 * 不自动 save — 由调用方决定
 */
function exec(sql) {
  getDb().exec(sql);
}

/**
 * 获取最后插入的 rowid
 */
function lastInsertRowid() {
  const result = getDb().exec('SELECT last_insert_rowid() AS id');
  return result[0]?.values?.[0]?.[0];
}

/**
 * 获取最近写操作影响的行数
 */
function getRowsModified() {
  return getDb().getRowsModified();
}

// ==================== 建表 ====================

function initTables() {
  exec(`
    CREATE TABLE IF NOT EXISTS api_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      api_key TEXT NOT NULL DEFAULT '',
      base_url TEXT NOT NULL DEFAULT 'https://api.deepseek.com',
      model TEXT NOT NULL DEFAULT 'deepseek-chat',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    INSERT OR IGNORE INTO api_config (id, api_key, base_url, model)
    VALUES (1, '', 'https://api.deepseek.com', 'deepseek-chat');

    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT '',
      table_schema TEXT NOT NULL,
      requirements TEXT NOT NULL,
      key_points TEXT NOT NULL DEFAULT '',
      expected_result_desc TEXT NOT NULL DEFAULT '',
      expected_sql TEXT NOT NULL DEFAULT '',
      difficulty TEXT NOT NULL DEFAULT 'medium',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_id INTEGER NOT NULL,
      user_sql TEXT NOT NULL,
      is_valid INTEGER NOT NULL DEFAULT 0,
      is_correct INTEGER NOT NULL DEFAULT 0,
      user_result TEXT NOT NULL DEFAULT '',
      expected_result TEXT NOT NULL DEFAULT '',
      optimization_suggestions TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_attempts_exercise ON attempts(exercise_id);
  `);

  // 迁移：为已有 exercises 表添加 table_data 列
  migrateAddColumn('exercises', 'table_data', "TEXT NOT NULL DEFAULT ''");
}

/**
 * 安全添加列（仅当列不存在时执行 ALTER TABLE）
 */
function migrateAddColumn(table, column, colDef) {
  const rows = queryAll(`SELECT COUNT(*) AS cnt FROM pragma_table_info('${table}') WHERE name = '${column}'`);
  if (rows[0]?.cnt === 0) {
    console.log(`[DB] 迁移: ${table} 添加列 ${column}`);
    exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${colDef}`);
    saveDb();
  }
}

module.exports = {
  initDatabase,
  getDb,
  saveDb,
  run,
  queryAll,
  queryOne,
  exec,
  lastInsertRowid,
  getRowsModified,
  DB_PATH,
};

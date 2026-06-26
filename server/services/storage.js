/**
 * 存储服务 — SQLite CRUD 操作封装 (sql.js 适配版)
 * API Key 配置独立存储于 JSON 文件，练习题/答题记录存储于 SQLite
 */
const fs = require('fs');
const path = require('path');
const { queryAll, queryOne, run, lastInsertRowid } = require('../db/init');

// ==================== API 配置文件路径 ====================

const CONFIG_PATH = path.join(__dirname, '..', 'data', 'api-config.json');

// ==================== API 配置（JSON 文件 — 多 Key 数组） ====================

/** 读取全部配置项 */
function readConfigs() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return [];
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[storage] 读取 API 配置失败:', err.message);
    return [];
  }
}

/** 写入全部配置项 */
function writeConfigs(configs) {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(configs, null, 2), 'utf-8');
}

/** 生成唯一 ID */
function generateId() {
  return 'key_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

/** 脱敏显示 API Key */
function maskKey(raw) {
  if (!raw) return '';
  if (raw.length > 12) return raw.slice(0, 7) + '····' + raw.slice(-5);
  if (raw.length > 0) return raw.slice(0, 5) + '····';
  return '';
}

// ==================== 对外 API ====================

/** 获取全部 Key 列表（脱敏） */
function listConfigs() {
  return readConfigs().map(c => ({
    ...c,
    masked_key: maskKey(c.api_key),
    api_key: maskKey(c.api_key), // 前端用脱敏值
  }));
}

/** 获取当前激活的 Key（完整，供 deepseek.js 使用） */
function getActiveConfig() {
  const configs = readConfigs();
  const active = configs.find(c => c.is_active);
  return active || configs[0] || null;
}

/** 检查是否有任何 Key 已配置 */
function hasAnyKey() {
  return readConfigs().some(c => c.api_key && c.api_key.trim());
}

/** 添加新 Key */
function addConfig({ name, api_key, base_url, model }) {
  const configs = readConfigs();
  const isFirst = configs.length === 0;
  const entry = {
    id: generateId(),
    name: name || '未命名',
    api_key: api_key.trim(),
    base_url: base_url || 'https://api.deepseek.com',
    model: model || 'deepseek-chat',
    is_active: isFirst ? true : false,
  };
  configs.push(entry);
  writeConfigs(configs);
  return { ...entry, masked_key: maskKey(entry.api_key), api_key: maskKey(entry.api_key) };
}

/** 更新指定 Key */
function updateConfig(id, { name, api_key, base_url, model }) {
  const configs = readConfigs();
  const idx = configs.findIndex(c => c.id === id);
  if (idx === -1) return null;
  if (name !== undefined) configs[idx].name = name;
  if (api_key !== undefined && api_key.trim()) configs[idx].api_key = api_key.trim();
  if (base_url !== undefined) configs[idx].base_url = base_url;
  if (model !== undefined) configs[idx].model = model;
  writeConfigs(configs);
  return { ...configs[idx], masked_key: maskKey(configs[idx].api_key), api_key: maskKey(configs[idx].api_key) };
}

/** 删除指定 Key */
function deleteConfig(id) {
  const configs = readConfigs();
  const idx = configs.findIndex(c => c.id === id);
  if (idx === -1) return false;
  const wasActive = configs[idx].is_active;
  configs.splice(idx, 1);
  // 如果删除的是激活项，激活第一个
  if (wasActive && configs.length > 0) {
    configs[0].is_active = true;
  }
  writeConfigs(configs);
  return true;
}

/** 设置激活 Key */
function setActiveConfig(id) {
  const configs = readConfigs();
  let found = false;
  for (const c of configs) {
    c.is_active = (c.id === id);
    if (c.id === id) found = true;
  }
  if (found) writeConfigs(configs);
  return found;
}

// ==================== 练习题 ====================

function saveExercise({ title, tableSchema, tableData, requirements, keyPoints, expectedResultDesc, expectedSql, difficulty = 'medium' }) {
  run(
    `INSERT INTO exercises (title, table_schema, table_data, requirements, key_points, expected_result_desc, expected_sql, difficulty)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, tableSchema, tableData || '', requirements, keyPoints, expectedResultDesc, expectedSql, difficulty]
  );
  const id = lastInsertRowid();
  return getExercise(id);
}

function getExercise(id) {
  const exercise = queryOne('SELECT * FROM exercises WHERE id = ?', [id]);
  if (exercise) {
    exercise.attempts = queryAll(
      'SELECT * FROM attempts WHERE exercise_id = ? ORDER BY created_at DESC',
      [id]
    );
  }
  return exercise;
}

function listExercises(limit = 50, offset = 0) {
  return queryAll(
    `SELECT e.id, e.title, e.table_schema, e.requirements, e.key_points,
            e.expected_result_desc, e.expected_sql, e.difficulty, e.created_at,
            COUNT(a.id) as attempt_count, MAX(a.created_at) as last_attempt_at
     FROM exercises e
     LEFT JOIN attempts a ON a.exercise_id = e.id
     GROUP BY e.id
     ORDER BY e.created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
}

function deleteExercise(id) {
  run('DELETE FROM exercises WHERE id = ?', [id]);
  return { changes: 1 };
}

// ==================== 答题记录 ====================

function saveAttempt({ exerciseId, userSql, isValid, isCorrect, userResult, expectedResult, optimizationSuggestions }) {
  run(
    `INSERT INTO attempts (exercise_id, user_sql, is_valid, is_correct, user_result, expected_result, optimization_suggestions)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      exerciseId,
      userSql,
      isValid ? 1 : 0,
      isCorrect ? 1 : 0,
      JSON.stringify(userResult || []),
      JSON.stringify(expectedResult || []),
      JSON.stringify(optimizationSuggestions || []),
    ]
  );
  const id = lastInsertRowid();
  return getAttempt(id);
}

function getAttempt(id) {
  const attempt = queryOne('SELECT * FROM attempts WHERE id = ?', [id]);
  return normalizeAttempt(attempt);
}

function getAttemptsByExercise(exerciseId) {
  const attempts = queryAll(
    'SELECT * FROM attempts WHERE exercise_id = ? ORDER BY created_at DESC',
    [exerciseId]
  );
  return attempts.map(normalizeAttempt);
}

function deleteAttempt(id) {
  run('DELETE FROM attempts WHERE id = ?', [id]);
  return { changes: 1 };
}

// ==================== 工具 ====================

function normalizeAttempt(attempt) {
  if (!attempt) return attempt;
  return {
    ...attempt,
    user_result: safeJsonParse(attempt.user_result, []),
    expected_result: safeJsonParse(attempt.expected_result, []),
    optimization_suggestions: safeJsonParse(attempt.optimization_suggestions, []),
  };
}

function safeJsonParse(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

module.exports = {
  CONFIG_PATH,
  listConfigs,
  getActiveConfig,
  hasAnyKey,
  addConfig,
  updateConfig,
  deleteConfig,
  setActiveConfig,
  saveExercise,
  getExercise,
  listExercises,
  deleteExercise,
  saveAttempt,
  getAttempt,
  getAttemptsByExercise,
  deleteAttempt,
};

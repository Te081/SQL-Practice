/**
 * 存储服务 — SQLite CRUD 操作封装 (sql.js 适配版)
 */
const { queryAll, queryOne, run, lastInsertRowid } = require('../db/init');

// ==================== API 配置 ====================

function getConfig() {
  return queryOne('SELECT * FROM api_config WHERE id = 1');
}

function saveConfig({ api_key, base_url, model }) {
  run(
    `UPDATE api_config
     SET api_key = ?, base_url = ?, model = ?, updated_at = datetime('now')
     WHERE id = 1`,
    [api_key, base_url, model]
  );
  return { changes: 1 };
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
  getConfig,
  saveConfig,
  saveExercise,
  getExercise,
  listExercises,
  deleteExercise,
  saveAttempt,
  getAttempt,
  getAttemptsByExercise,
  deleteAttempt,
};

/**
 * 历史记录路由 — 练习历史查询与删除
 */
const { Router } = require('express');
const storage = require('../services/storage');
const { extractTables, executeQuery } = require('../services/table-parser');

const { queryAll } = require('../db/init');

const router = Router();

// GET /api/history/stats — 获取用户统计概览
router.get('/stats', (req, res) => {
  try {
    const stats = queryAll(`
      SELECT
        (SELECT COUNT(*) FROM exercises) AS total_exercises,
        (SELECT COUNT(*) FROM attempts) AS total_attempts,
        (SELECT COUNT(*) FROM attempts WHERE is_correct = 1) AS correct_attempts
    `);
    const s = stats[0] || {};
    const total = Number(s.total_attempts) || 0;
    const correct = Number(s.correct_attempts) || 0;
    res.json({
      totalExercises: Number(s.total_exercises) || 0,
      totalAttempts: total,
      correctAttempts: correct,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    });
  } catch (err) {
    res.json({ totalExercises: 0, totalAttempts: 0, correctAttempts: 0, accuracy: 0 });
  }
});

// GET /api/history — 获取所有练习记录列表
router.get('/', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;

  const exercises = storage.listExercises(limit, offset);
  res.json(exercises);
});

// GET /api/history/:id — 获取某次练习的完整详情（含预解析的表数据）
router.get('/:id', async (req, res, next) => {
  try {
    const exercise = storage.getExercise(Number(req.params.id));
    if (!exercise) {
      return res.status(404).json({ error: '记录不存在' });
    }

    // 预解析表数据（非致命）
    let tables = [];
    try {
      tables = await extractTables(
        exercise.table_schema,
        exercise.table_data || ''
      );
    } catch (parseErr) {
      console.warn('[history] 表数据预解析失败:', parseErr.message);
    }

    // 执行预期 SQL 获取参考答案结果集（非致命）
    let expectedResult = null;
    if (exercise.expected_sql) {
      try {
        expectedResult = await executeQuery(
          exercise.table_schema,
          exercise.table_data || '',
          exercise.expected_sql
        );
      } catch (queryErr) {
        console.warn('[history] 预期 SQL 执行失败:', queryErr.message);
      }
    }

    res.json({ ...exercise, tables, expectedResult });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/history/:id — 删除某条历史记录
router.delete('/:id', (req, res) => {
  const result = storage.deleteExercise(Number(req.params.id));
  if (result.changes === 0) {
    return res.status(404).json({ error: '记录不存在' });
  }
  res.json({ ok: true });
});

module.exports = router;

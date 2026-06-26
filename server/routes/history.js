/**
 * 历史记录路由 — 练习历史查询与删除
 */
const { Router } = require('express');
const storage = require('../services/storage');
const { extractTables } = require('../services/table-parser');

const router = Router();

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

    res.json({ ...exercise, tables });
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

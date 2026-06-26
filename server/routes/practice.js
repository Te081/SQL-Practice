/**
 * 练习路由 — 题目生成 / SQL 校验 / 模拟执行 / 调优建议
 */
const { Router } = require('express');
const storage = require('../services/storage');
const deepseek = require('../services/deepseek');
const sqlEngine = require('../services/sql-engine');
const { extractTables } = require('../services/table-parser');

const router = Router();

// ==================== 路由 ====================

// POST /api/practice/generate — 生成新题目
router.post('/generate', async (req, res, next) => {
  try {
    const { difficulty = 'medium', topic = '' } = req.body;

    // 调用 DeepSeek 生成题目
    const exerciseData = await deepseek.generateExercise({ difficulty, topic });

    // 校验必要字段
    if (!exerciseData.tableSchema || !exerciseData.expectedSql) {
      return res.status(500).json({
        error: 'DeepSeek 生成的题目数据不完整，请重试',
      });
    }

    // 持久化到数据库（含 DML 测试数据）
    const exercise = storage.saveExercise({
      title: exerciseData.title || 'SQL 练习题',
      tableSchema: exerciseData.tableSchema,
      tableData: exerciseData.tableData || '',
      requirements: exerciseData.requirements || '',
      keyPoints: exerciseData.keyPoints || '',
      expectedResultDesc: exerciseData.expectedResultDesc || '',
      expectedSql: exerciseData.expectedSql,
      difficulty: exerciseData.difficulty || difficulty,
    });

    // 预解析表数据（非致命 — 失败时不阻断整体响应）
    let tables = [];
    try {
      tables = await extractTables(
        exerciseData.tableSchema,
        exerciseData.tableData || ''
      );
    } catch (parseErr) {
      console.warn('[practice] 表数据预解析失败，降级到原始 DML 文本:', parseErr.message);
    }

    res.json({
      exercise,
      tableData: exerciseData.tableData || '',
      tables,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/practice/validate — 校验用户 SQL
router.post('/validate', async (req, res, next) => {
  try {
    const { exerciseId, userSql, tableData } = req.body;

    if (!exerciseId) {
      return res.status(400).json({ error: '缺少 exerciseId' });
    }
    if (!userSql || !userSql.trim()) {
      return res.status(400).json({ error: 'SQL 语句不能为空' });
    }

    // 获取题目数据
    const exercise = storage.getExercise(exerciseId);
    if (!exercise) {
      return res.status(404).json({ error: '题目不存在' });
    }

    // 模拟执行并比对结果 (async — sql.js 引擎)
    const execResult = await sqlEngine.executeAndCompare({
      tableSchema: exercise.table_schema,
      tableData: tableData || '',
      userSql: userSql.trim(),
      expectedSql: exercise.expected_sql,
    });

    // 记录答题
    const attempt = storage.saveAttempt({
      exerciseId,
      userSql: userSql.trim(),
      isValid: execResult.valid ? 1 : 0,
      isCorrect: execResult.isCorrect ? 1 : 0,
      userResult: execResult.userResult || [],
      expectedResult: execResult.expectedResult || [],
      optimizationSuggestions: [],
    });

    res.json({
      attempt,
      validation: {
        valid: execResult.valid,
        error: execResult.error || null,
        isCorrect: execResult.isCorrect || false,
        userResult: execResult.userResult || [],
        expectedResult: execResult.expectedResult || [],
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/practice/optimize — 获取调优建议
router.post('/optimize', async (req, res, next) => {
  try {
    const { exerciseId, userSql, attemptId } = req.body;

    if (!exerciseId || !userSql) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const exercise = storage.getExercise(exerciseId);
    if (!exercise) {
      return res.status(404).json({ error: '题目不存在' });
    }

    // 调用 DeepSeek 生成优化建议
    const suggestions = await deepseek.generateOptimization(
      userSql,
      exercise.table_schema,
      exercise.expected_sql
    );

    // 更新答题记录中的优化建议
    if (attemptId) {
      const { run } = require('../db/init');
      run('UPDATE attempts SET optimization_suggestions = ? WHERE id = ?',
        [JSON.stringify(suggestions), attemptId]);
    }

    res.json({ suggestions });
  } catch (err) {
    next(err);
  }
});

// GET /api/practice/:id — 获取题目详情（含答题记录）
router.get('/:id', (req, res) => {
  const exercise = storage.getExercise(Number(req.params.id));
  if (!exercise) {
    return res.status(404).json({ error: '题目不存在' });
  }
  res.json(exercise);
});

module.exports = router;

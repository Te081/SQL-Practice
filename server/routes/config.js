/**
 * API 配置路由 — 多 Key 管理
 */
const { Router } = require('express');
const storage = require('../services/storage');
const deepseek = require('../services/deepseek');

const router = Router();
const { CONFIG_PATH } = storage;

// GET /api/config — 获取全部 Key 列表
router.get('/', (req, res) => {
  const configs = storage.listConfigs();
  res.json({
    configs,
    has_any_key: storage.hasAnyKey(),
    storage_path: CONFIG_PATH,
  });
});

// POST /api/config — 添加新 Key
router.post('/', (req, res) => {
  const { name, api_key, base_url, model } = req.body;
  if (!api_key || !api_key.trim()) {
    return res.status(400).json({ error: 'API Key 不能为空' });
  }
  const entry = storage.addConfig({ name, api_key, base_url, model });
  res.json({ ok: true, entry });
});

// PUT /api/config/:id — 更新指定 Key
router.put('/:id', (req, res) => {
  const { name, api_key, base_url, model } = req.body;
  const entry = storage.updateConfig(req.params.id, { name, api_key, base_url, model });
  if (!entry) return res.status(404).json({ error: 'Key 不存在' });
  res.json({ ok: true, entry });
});

// DELETE /api/config/:id — 删除指定 Key
router.delete('/:id', (req, res) => {
  const ok = storage.deleteConfig(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Key 不存在' });
  res.json({ ok: true });
});

// POST /api/config/:id/activate — 激活指定 Key
router.post('/:id/activate', (req, res) => {
  const ok = storage.setActiveConfig(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Key 不存在' });
  res.json({ ok: true });
});

// POST /api/config/:id/test — 测试指定 Key 连接
router.post('/:id/test', async (req, res, next) => {
  try {
    const configs = JSON.parse(require('fs').readFileSync(CONFIG_PATH, 'utf-8'));
    const config = configs.find(c => c.id === req.params.id);
    if (!config) return res.status(404).json({ error: 'Key 不存在' });
    const result = await deepseek.testConnection(config);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/config/test — 测试激活的 Key 连接
router.post('/test', async (req, res, next) => {
  try {
    const result = await deepseek.testConnection();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

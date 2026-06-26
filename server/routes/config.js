/**
 * API 配置路由 — DeepSeek API Key / Base URL / Model 管理
 */
const { Router } = require('express');
const storage = require('../services/storage');
const deepseek = require('../services/deepseek');

const router = Router();

const { DB_PATH } = require('../db/init');

// GET /api/config — 获取当前配置（api_key 脱敏显示）
router.get('/', (req, res) => {
  const config = storage.getConfig();
  if (!config) {
    return res.json({
      api_key: '',
      masked_key: '',
      base_url: 'https://api.deepseek.com',
      model: 'deepseek-chat',
      has_key: false,
      storage_path: DB_PATH,
    });
  }

  const rawKey = config.api_key || '';
  let maskedKey = '';
  if (rawKey.length > 12) {
    maskedKey = rawKey.slice(0, 7) + '····' + rawKey.slice(-5);
  } else if (rawKey.length > 0) {
    maskedKey = rawKey.slice(0, 5) + '····';
  }

  res.json({
    api_key: maskedKey,
    masked_key: maskedKey,
    base_url: config.base_url,
    model: config.model,
    has_key: !!rawKey,
    storage_path: DB_PATH,
  });
});

// PUT /api/config — 保存配置
router.put('/', (req, res) => {
  const { api_key, base_url, model } = req.body;

  if (!api_key || !api_key.trim()) {
    return res.status(400).json({ error: 'API Key 不能为空' });
  }

  storage.saveConfig({
    api_key: api_key.trim(),
    base_url: base_url || 'https://api.deepseek.com',
    model: model || 'deepseek-chat',
  });

  res.json({ ok: true, message: '配置已保存' });
});

// DELETE /api/config — 删除 API Key（清空密钥，保留 base_url 和 model）
router.delete('/', (req, res) => {
  const config = storage.getConfig();
  storage.saveConfig({
    api_key: '',
    base_url: config?.base_url || 'https://api.deepseek.com',
    model: config?.model || 'deepseek-chat',
  });
  res.json({ ok: true, message: 'API Key 已删除' });
});

// POST /api/config/test — 测试 DeepSeek 连接
router.post('/test', async (req, res, next) => {
  try {
    const result = await deepseek.testConnection();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

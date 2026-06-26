/**
 * Express 服务入口
 */
const express = require('express');
const cors = require('cors');
const path = require('path');

const { initDatabase } = require('./db/init');
const errorHandler = require('./middleware/error-handler');
const configRoutes = require('./routes/config');
const practiceRoutes = require('./routes/practice');
const historyRoutes = require('./routes/history');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// API 路由
app.use('/api/config', configRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/history', historyRoutes);

// 生产环境：托管前端构建产物
const fs = require('fs');
const clientDist = path.resolve(__dirname, '..', 'client', 'dist');

// 检查构建产物是否存在
if (fs.existsSync(clientDist) && fs.existsSync(path.join(clientDist, 'index.html'))) {
  console.log(`[Static] 托管前端: ${clientDist}`);
} else {
  console.warn(`[Static] ⚠️ 未找到前端构建产物: ${clientDist}`);
  console.warn(`[Static] 请先运行: cd client && npm run build`);
}

app.use(express.static(clientDist, { fallthrough: true }));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const indexPath = path.join(clientDist, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return res.status(503).send(`
      <html><body style="font-family:sans-serif;text-align:center;padding-top:60px;">
      <h2>⚠️ 前端未构建</h2>
      <p>请在项目根目录执行:</p>
      <pre>cd client && npm run build</pre>
      <p>然后重启服务器。</p>
      </body></html>
    `);
  }
  res.sendFile(indexPath);
});

// 错误处理
app.use(errorHandler);

// 全局未捕获异常处理 — 防止 DeepSeek API 超时等导致进程崩溃
process.on('uncaughtException', (err) => {
  console.error('[FATAL] 未捕获异常:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] 未处理的 Promise 拒绝:', reason?.message || reason);
});

// 异步启动：先初始化数据库，再监听端口
async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`[SQL Practice Server] 运行在 http://localhost:${PORT}`);
    console.log(`[SQL Practice Server] API: http://localhost:${PORT}/api`);
  });
}

start().catch(err => {
  console.error('启动失败:', err);
  process.exit(1);
});

module.exports = app;

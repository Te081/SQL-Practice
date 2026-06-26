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
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) next();
  });
});

// 错误处理
app.use(errorHandler);

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

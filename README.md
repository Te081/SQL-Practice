# SQL Practice — 交互式 SQL 练习平台

结合 **DeepSeek API** 的智能 SQL 练习工具，具备自动生成练习题、可视化数据表、SQL 校验执行和调优建议等功能。

## ✨ 功能特性

- 🔗 **DeepSeek API 集成** — 可配置 API Key / Base URL / Model，自动生成贴近业务场景的 SQL 练习题
- 📊 **可视化数据表** — 自动解析 DDL/DML，以表格形式直观展示练习数据
- ✏️ **SQL 在线编辑** — 内置代码编辑器，支持语法高亮风格的输入体验
- ✅ **SQL 校验与模拟执行** — 在内存 SQLite 中真实执行 SQL，精确比对查询结果
- 🔧 **智能调优建议** — 答案正确后，DeepSeek 分析你的 SQL 并给出优化建议及详细解释
- 📝 **历史记录** — 保存所有练习题、答题记录和调优建议，可随时回顾

## 🛠 技术栈

| 层 | 技术 |
|---|---|
| 前端框架 | Vue 3 (Composition API) |
| 构建工具 | Vite |
| 状态管理 | Pinia |
| 路由 | Vue Router 4 |
| 后端框架 | Express (Node.js) |
| 数据库 | SQLite (sql.js — WASM 实现，无需原生编译) |
| SQL 解析 | node-sql-parser |
| AI 接口 | OpenAI SDK → DeepSeek |

## 📁 项目结构

```
SQL Practice/
├── README.md
├── package.json
├── .gitignore
├── setup.bat                  # Windows 一键安装脚本
├── server/
│   ├── index.js               # Express 入口
│   ├── middleware/
│   │   └── error-handler.js   # 统一错误处理
│   ├── routes/
│   │   ├── config.js          # API 配置路由
│   │   ├── practice.js        # 练习路由
│   │   └── history.js         # 历史记录路由
│   ├── services/
│   │   ├── deepseek.js        # DeepSeek API 客户端
│   │   ├── sql-engine.js      # SQL 校验 + 模拟执行
│   │   └── storage.js         # SQLite 存储封装
│   └── db/
│       └── init.js            # 数据库初始化
├── client/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.js
│       ├── App.vue
│       ├── router/index.js
│       ├── stores/
│       │   ├── config.js      # API 配置 store
│       │   ├── practice.js    # 练习 store
│       │   └── history.js     # 历史记录 store
│       ├── views/
│       │   ├── ConfigView.vue
│       │   ├── PracticeView.vue
│       │   └── HistoryView.vue
│       ├── components/
│       │   ├── AppNav.vue
│       │   ├── DataTable.vue
│       │   ├── SqlEditor.vue
│       │   ├── ResultPanel.vue
│       │   └── HistoryCard.vue
│       └── styles/
│           └── global.css
```

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18
- **npm** >= 9

### 安装

**Windows 用户**：双击运行 `setup.bat`，自动完成安装。

**手动安装**：

```bash
# 进入项目目录
cd "D:\05 File\SQL Practice"

# 安装服务端依赖
cd server && npm install && cd ..

# 安装客户端依赖
cd client && npm install && cd ..
```

### 启动开发环境

**分别启动（推荐调试时使用）**：

```bash
# 终端 1 — 启动后端 (端口 3001)
cd server
npm run dev

# 终端 2 — 启动前端 (端口 5173)
cd client
npm run dev
```

然后访问 **http://localhost:5173**

### 生产构建

```bash
cd client && npm run build && cd ..
node server/index.js
# 访问 http://localhost:3001
```

## ⚙️ 使用指南

### 1. 配置 DeepSeek API

1. 访问 [DeepSeek 开放平台](https://platform.deepseek.com/) 获取 API Key
2. 在应用内点击 **API 配置**，填入 API Key
3. 点击 **测试连接** 确认配置正确

### 2. 开始练习

1. 进入 **练习** 页面
2. 选择难度和主题偏好，点击 **生成题目**
3. 查看数据表结构和练习要求
4. 在编辑器中编写 SQL 语句
5. 点击 **校验执行** 查看结果比对
6. 答案正确后可点击 **获取调优建议**

### 3. 查看历史

进入 **历史记录** 页面，可查看所有做过的题目和答题详情。

## 📝 API 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/config` | 获取 API 配置 |
| PUT | `/api/config` | 保存 API 配置 |
| POST | `/api/config/test` | 测试连接 |
| POST | `/api/practice/generate` | 生成练习题 |
| POST | `/api/practice/validate` | 校验 SQL |
| POST | `/api/practice/optimize` | 获取调优建议 |
| GET | `/api/practice/:id` | 获取题目详情 |
| GET | `/api/history` | 历史记录列表 |
| GET | `/api/history/:id` | 历史详情 |
| DELETE | `/api/history/:id` | 删除记录 |

## 📄 License

MIT

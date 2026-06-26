# SQL Practice — 交互式 SQL 练习平台

结合 **DeepSeek API** 的智能 SQL 练习工具，支持多 API Key 管理、自动生成练习题、可视化数据表、SQL 校验执行、调优建议及完整历史记录。

## 📑 目录

- [🚀 快速开始](#-快速开始)
- [✨ 功能特性](#-功能特性)
- [🛠 技术栈](#-技术栈)
- [📁 项目结构](#-项目结构)
- [⚙️ 使用指南](#️-使用指南)
- [🔄 项目迁移](#-项目迁移)
- [📚 开发文档](#-开发文档)
- [📝 API 接口](#-api-接口)

## ✨ 功能特性

- 🔗 **多 API Key 管理** — 支持添加多个 DeepSeek API Key，命名区分、激活切换、独立测试
- 📊 **可视化数据表** — 服务端预解析 DDL/DML，以交互式表格展示练习数据
- ✏️ **SQL 在线编辑** — 内置深色代码编辑器，支持语法校验与模拟执行
- ✅ **实时结果比对** — 在内存 SQLite 中真实执行 SQL，左右双栏对比用户结果与预期结果
- 🔧 **智能调优建议** — 答案正确后，DeepSeek 分析 SQL 并给出优化建议及详细解释
- 💡 **提示系统** — 参考答案默认隐藏，点击「提示」按钮逐步揭示
- 📝 **历史记录** — 保存所有练习题、答题记录和调优建议，支持展开复习与再次答题
- 👤 **个人中心** — 学习统计概览 + API Key 状态 + 分页练习足迹
- 🦉 **伴学宠物** — 右下角交互式猫头鹰，点击不同部位触发动画与气泡语录
- 🎨 **动态背景** — 5 轨水平滚动 SQL 关键字与调优原则，随机 RGB 色彩

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
├── setup.bat                  # Windows 一键安装依赖
├── launcher.hta               # 图形化启动面板（推荐）
├── setup.bat                  # Windows 一键安装依赖
├── start.bat                  # Windows 一键构建 + 后台启动 + 打开浏览器（自动关闭）
├── stop.bat                   # 停止后台服务
├── server/
│   ├── index.js               # Express 入口
│   ├── middleware/
│   │   └── error-handler.js   # 统一错误处理
│   ├── routes/
│   │   ├── config.js          # 多 Key 管理路由
│   │   ├── practice.js        # 练习路由（生成 / 校验 / 调优）
│   │   └── history.js         # 历史记录路由（列表 / 详情 / 统计）
│   ├── services/
│   │   ├── deepseek.js        # DeepSeek API 客户端（多 Key 支持）
│   │   ├── sql-engine.js      # SQL 语法校验 + 模拟执行引擎
│   │   ├── storage.js         # 配置 JSON 文件 + SQLite 存储封装
│   │   └── table-parser.js    # DDL/DML 预解析工具
│   ├── db/
│   │   └── init.js            # 数据库初始化 + 迁移
│   └── data/
│       └── api-config.json    # API Key 配置文件（独立于 SQLite）
├── client/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.js
│       ├── App.vue
│       ├── router/index.js
│       ├── stores/
│       │   ├── config.js      # 多 Key Pinia Store
│       │   ├── practice.js    # 练习 Store
│       │   └── history.js     # 历史 Store
│       ├── views/
│       │   ├── HistoryView.vue # 练习历史（含题目生成）
│       │   ├── ProfileView.vue # 个人中心
│       │   ├── ConfigView.vue  # API Key 管理
│       │   └── PracticeView.vue# 练习页（保留文件，未挂载路由）
│       ├── components/
│       │   ├── AppNav.vue      # 导航栏
│       │   ├── BackgroundScroll.vue # SQL 语法滚动背景
│       │   ├── StudyPet.vue    # 伴学猫头鹰宠物
│       │   ├── Modal.vue       # 通用弹窗
│       │   ├── DataTable.vue   # 可视化数据表
│       │   ├── SqlEditor.vue   # SQL 代码编辑器
│       │   ├── ResultPanel.vue # 校验结果面板
│       │   └── HistoryCard.vue # 历史记录卡片
│       └── styles/
│           └── global.css      # 全局设计系统
```

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18
- **npm** >= 9

### 安装

**图形面板（推荐）**：双击 `launcher.hta`，点击「安装依赖」→「一键启动」。

**命令行**：

```bash
# 在项目根目录下执行
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### 启动开发环境

```bash
# 终端 1 — 后端 (端口 3001)
cd server && npm run dev

# 终端 2 — 前端 (端口 5173)
cd client && npm run dev
```

访问 **http://localhost:5173**

### 一键构建并启动（生产模式）

**图形面板**：双击 `launcher.hta`，点击「🚀 一键启动」。

**命令行**：双击 `start.bat`，自动：
1. 构建前端到 `client/dist/`
2. 后台静默启动服务（端口 3001，不占用任务栏）
3. 调用系统默认浏览器打开 `http://localhost:3001`
4. 终端窗口 3 秒后自动关闭

> 停止服务：双击 `stop.bat` 或 `launcher.hta` 中点击「停止」。

**手动执行**：

```bash
cd client && npm run build && cd ..
node server/index.js
# 访问 http://localhost:3001
```

## ⚙️ 使用指南

### 1. 配置 API Key

1. 访问 [DeepSeek 开放平台](https://platform.deepseek.com/) 获取 API Key
2. 进入 **配置** 页面，点击添加 Key
3. 填写名称（如"个人账号"）、Key、接口地址、模型
4. 点击「测试」验证连接，支持添加多个 Key 并激活切换

### 2. 生成与练习

1. 进入 **练习历史** 页面
2. 在顶部选择难度和主题偏好，点击「生成题目」
3. 题目生成后自动出现在历史列表中，点击展开
4. 查看数据表结构（DDL）与可视化预览
5. 在 SQL 输入框中编写语句，点击「提交比对」查看执行结果与预期对比
6. 点击「提示」按钮查看参考答案与预期执行结果

### 3. 个人中心

进入 **个人** 页面，查看：
- 学习统计（生成题目数、答题次数、正确数、正确率）
- API Key 配置状态
- 分页练习足迹（默认 5 条/页，可配置 5/10/15/20）

## 🔄 项目迁移

项目所有路径均为相对路径，无需任何配置修改。迁移到新机器只需：

```
1. 复制整个项目目录到目标机器
2. 双击 launcher.hta  → 点击「安装依赖」（首次）
3. 点击「一键启动」  → 构建 + 后台启动 + 自动打开浏览器
```

> API Key 配置文件 `server/data/api-config.json` 已在 `.gitignore` 中排除，不会随 git 推送泄露。

## 📚 开发文档

- **API Key 模块**：详见全局 Skill `APIKEY-SKILL`（`/skill APIKEY-SKILL` 调用），涵盖多 Key 存储、路由、DeepSeek 集成与前端 Store 完整架构。

## 📝 API 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/config` | 获取全部 Key 列表 |
| `POST` | `/api/config` | 添加新 Key |
| `PUT` | `/api/config/:id` | 更新指定 Key |
| `DELETE` | `/api/config/:id` | 删除指定 Key |
| `POST` | `/api/config/:id/activate` | 激活指定 Key |
| `POST` | `/api/config/:id/test` | 测试指定 Key 连接 |
| `POST` | `/api/config/test` | 测试当前激活 Key |
| `POST` | `/api/practice/generate` | 生成练习题 |
| `POST` | `/api/practice/validate` | 校验 SQL |
| `POST` | `/api/practice/optimize` | 获取调优建议 |
| `GET` | `/api/practice/:id` | 获取题目详情 |
| `GET` | `/api/history/stats` | 学习统计概览 |
| `GET` | `/api/history` | 历史记录列表（分页） |
| `GET` | `/api/history/:id` | 历史详情（含表解析 + 预期结果） |
| `DELETE` | `/api/history/:id` | 删除记录 |

## 📄 License

MIT

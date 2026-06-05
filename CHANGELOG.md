# 更新日志 (Changelog)

> 本文件记录智码圈（码坚强）项目的所有版本变更。  
> 格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/) 规范。

---

## [1.1.5] - 2026-06-04

### ✨ 新增 (Added)

- **社交系统（好友 + 私聊 + 频道）**
  - 好友系统：搜索 UID 添加好友、好友申请审批、好友列表、删除好友
  - 私聊：好友间 1v1 实时聊天（Socket.IO WebSocket），消息记录分页
  - 频道：创建/搜索/加入频道，频道内多人实时聊天，管理员踢人
  - 导航栏新增「社交」入口
- **Socket.IO WebSocket 实时通信**
  - `server/websocket.js` — WebSocket 服务初始化与事件处理
  - `src/api/socket.js` — 前端 WebSocket 客户端
  - 私聊和频道消息实时推送
- **新增 6 张数据库表**：`friend_requests`, `friends`, `private_messages`, `channels`, `channel_members`, `channel_messages`

### 🛠 变更 (Changed)

- 服务器架构：Express 从 `app.listen()` 改为 `http.createServer(app)` + Socket.IO 集成
- 首页删除统计卡片区块（接口请求失败显示 "..."）
- 动态用户名「龙虾哥🦞」→「码坚强」

## [1.1.4] - 2026-06-03

### 🐛 修复 (Fixed)

- **Navbar 遮挡轮播图**：APP 端 Navbar 使用 `position: fixed` 脱离文档流，导致 Banner 顶部被遮挡。主内容区添加 `paddingTop: calc(56px + var(--status-bar-height, 0px))` 补偿 Navbar 高度

### ✨ 新增 (Added)

- **QQ OAuth 登录**：实现 QQ 互联 OAuth 2.0 授权码模式完整流程
  - `GET /api/oauth/qq/url` — 获取授权 URL
  - `GET /api/oauth/qq/callback` — 处理回调、自动注册/登录
  - WEB 端通过系统浏览器完成授权
  - APP 端通过 `@capacitor/browser` 内嵌浏览器完成授权
- **账号注销**：`DELETE /api/auth/account`，需二次密码确认，立即删除个人数据
- **反馈系统**：`POST /api/feedback`，支持举报/建议/问题反馈/其他四种类型
- **敏感词过滤**：基于 DFA 算法的 `sensitiveCheckMiddleware`，社区动态发布时实时检测
- **品牌自动切换**：检测运行环境，WEB 端显示"码坚强"，APP 端显示"智码圈"
- **测试账号接口**：`POST /api/auth/create-test-user`，仅限 localhost 调用
- **开发者文档**：`DEVELOPER_GUIDE.md`（项目根目录）
- **部署教程**：`智码圈部署实战教程.md`

### 🔧 变更 (Changed)

- 版本号：`versionCode 5 → 6`，`versionName 1.1.3 → 1.1.4`
- 服务端全部模块已部署至生产环境（oauth、feedback、sensitive-words）
- APK 下载链接指向 v1.1.4

### 📝 文档 (Documentation)

- 新增 `CHANGELOG.md`（本文件）
- 新增 `DEVELOPER_GUIDE.md` — 完整开发者文档（技术栈、API 接口、部署流程等）
- 新增 `智码圈部署实战教程.md` — 面向 CSDN 等技术社区的部署教程

---

## [1.1.3] - 2026-06-02

### ✨ 新增 (Added)

- 微信登录集成（`@capgo/capacitor-wechat` SDK）
- 社区动态列表展示（最新 50 条）
- Agent 推荐页面（9 个预置 Agent 卡片）
- 工具下载集市（上传/列表/搜索/下载计数）
- 技能广场（模板展示 + 搜索 + 分类筛选）

### 🔧 变更 (Changed)

- 版本号：`versionCode 4 → 5`，`versionName 1.1.2 → 1.1.3`

---

## [1.1.2] - 2026-06-01

### ✨ 新增 (Added)

- Capacitor Android 平台封装
- 返回手势控制（导航栈，首页最小化）
- 状态栏适配（灰色底 + 深色图标）
- 全面屏适配（CSS 变量 `--status-bar-height`）

---

## [1.1.0] - 2026-05-31

### ✨ 新增 (Added)

- 用户注册/登录（邮箱 + bcrypt + JWT）
- 邮箱验证码（QQ SMTP）
- 首页轮播图（HeroBanner）
- MUI 深色主题 + Tailwind 自定义主题
- HexBackground Canvas 数字雨背景动效
- AIChatBot AI 对话浮窗（DashScope qwen-plus）

---

## [1.0.0] - 2026-05-28

### ✨ 新增 (Added)

- 项目初始化：Vite + React 18 + MUI v5 + Tailwind CSS v3
- Express 后端框架搭建
- sql.js 嵌入式数据库
- Nginx + PM2 生产环境部署
- 基础页面路由（首页、技能广场、Agent 推荐、工具下载）

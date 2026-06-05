# 智码圈（码坚强）开发者文档

> AI Agent 开发者社区 — 前端 SPA + 后端 Express + Capacitor 跨平台移动应用

**版本**：v1.1.5 | **更新**：2026-06-04

---

## 一、项目概述

**智码圈**（WEB 端品牌名「码坚强」）是一个面向 AI Agent 开发者的社区平台，提供技能分享、工具下载、社区动态、AI 助手等功能。

- **WEB 端**：http://bitopen.online
- **APP 下载**：http://bitopen.online/download/zhimaquan.apk
- **隐私政策**：http://bitopen.online/privacy.html
- **测试账号**：`test@zhimaquan.com` / 密码 `25802580`

### 品牌说明

| 环境 | 品牌名 | 说明 |
|------|--------|------|
| 网页端 | 码坚强 | AI Agent 开发者社区 |
| APP 端（Android / iOS） | 智码圈 | 同一套代码，自动切换品牌 |

---

## 二、技术栈

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3 | UI 框架 |
| React Router | 6.23 | SPA 路由 |
| MUI (Material UI) | 5.15 | 组件库 + 深色主题 |
| Tailwind CSS | 3.4 | 原子化 CSS |
| Vite | 5.2 | 构建工具 |
| Axios | 1.7 | HTTP 客户端 |

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js / Express | 4.19 | Web 框架 |
| sql.js (WASM) | 1.10 | 嵌入式 SQLite（纯 JS，无需原生依赖） |
| bcryptjs | 2.4 | 密码哈希 |
| jsonwebtoken | 9.0 | JWT 认证（7天过期） |
| multer | 1.4 | 文件上传 |
| nodemailer | 6.9 | SMTP 邮件发送 |

### 移动端

| 技术 | 版本 | 用途 |
|------|------|------|
| Capacitor | 8.x | 跨平台容器（Android + iOS） |
| @capacitor/app | 8.1 | App 生命周期 + 返回手势 |
| @capacitor/browser | 8.0 | 系统浏览器（OAuth） |
| @capacitor/status-bar | 8.0 | 状态栏控制 |
| @capgo/capacitor-wechat | 8.0 | 微信 SDK 集成 |

---

## 三、项目结构

```
code-strong/
├── src/                          # 前端源码
│   ├── main.jsx                  # React 入口（MUI Theme + Router + AuthProvider）
│   ├── App.jsx                   # 根组件（路由、导航、弹窗管理）
│   ├── api/                      # API 调用层（Axios 实例 + 各模块封装）
│   ├── components/               # 共享 UI 组件（Navbar、Footer、HeroBanner、AIChatBot等）
│   ├── contexts/                 # React Context（AuthContext）
│   ├── data/                     # 前端静态数据（Agent列表、轮播图、工具）
│   ├── hooks/                    # 自定义 Hook（useCardGlow 卡片追光效果）
│   ├── pages/                    # 页面组件（懒加载）
│   └── index.css                 # 全局样式 + 动效
├── server/                       # 后端
│   ├── index.js                  # Express 入口（含 Socket.IO 集成）
│   ├── websocket.js               # Socket.IO WebSocket 服务
│   ├── .env                      # 环境变量
│   ├── db/                       # 数据库初始化 + 种子数据
│   ├── middleware/                # 中间件（auth、敏感词过滤）
│   ├── routes/                   # API 路由（8 个模块）
│   ├── utils/                    # 工具（邮件发送）
│   └── tools/                    # AI 工具函数（天气、文生图）
├── public/                       # 静态资源
│   ├── privacy.html              # 隐私政策
│   ├── skills/                   # 可下载的技能包（ZIP）
│   └── pixel-room/               # 像素艺术素材
├── android/                      # Android 原生平台
├── ios/                          # iOS 原生平台
├── dist/                         # Vite 构建输出
├── capacitor.config.json          # Capacitor 配置
├── vite.config.js                # Vite 配置
└── tailwind.config.js            # Tailwind 主题配置
```

---

## 四、功能模块

### 4.1 用户系统

| 功能 | 说明 |
|------|------|
| 邮箱注册 | 需邮箱验证码，密码 ≥ 6 位 |
| 邮箱 / UID 登录 | 支持邮箱或 UID（如 M002）登录 |
| QQ OAuth 登录 | QQ 互联开放平台，网页 + APP 内嵌浏览器 |
| 微信登录 | 微信开放平台（扫码 + APP 内 SDK） |
| 忘记密码 | 邮箱验证码重置 |
| 账号设置 | 修改昵称、邮箱、头像、签名 |
| 账号注销 | 自助注销（需二次确认），立即删除数据 |

### 4.2 社区功能

| 功能 | 说明 |
|------|------|
| 社区动态 | 首页展示最新 50 条社区动态 |
| 发表动态 | 需登录，敏感词 DFA 过滤 |
| 技能广场 | 展示可复制的 AI 技能模板（含搜索+分类） |
| Agent 推荐 | 9 个预置 AI Agent 推荐卡片 |

### 4.3 工具下载集市

| 功能 | 说明 |
|------|------|
| 工具列表 | 按下载量排序，支持分类筛选 |
| 工具上传 | 需登录，填写名称、描述、分类、标签 |
| 下载计数 | 每次下载 +1 |
| 搜索 | 按名称搜索 |

### 4.4 AI 助手

- **AI 对话**：右下角 AI 聊天浮窗，基于阿里云 DashScope（qwen-plus 模型）
- **Function Calling**：支持天气查询（wttr.in）和文生图（通义万相 2.1）
- **像素宠物**：首页像素龙虾互动角色

### 4.5 其他功能

- **全站背景**：Canvas 数字雨动效（HexBackground）
- **卡片追光**：鼠标悬停 3D 倾斜 + 光晕效果
- **小游戏**：网页端专属（像素龙虾相关）
- **反馈系统**：举报 / 建议 / 问题反馈

### 4.6 社交系统

| 功能 | 说明 |
|------|------|
| 好友系统 | 搜索 UID 添加好友，好友申请（同意/拒绝），删除好友 |
| 私聊 | 好友间 1v1 实时聊天，WebSocket 推送，消息记录分页 |
| 频道 | 创建/搜索/加入频道，频道内多人实时聊天，成员管理（管理员踢人） |

#### WebSocket 事件

| 方向 | 事件 | 说明 |
|------|------|------|
| 客户端→服务器 | `send_private_message` | `{to_user_id, content}` 发送私聊消息 |
| 客户端→服务器 | `send_channel_message` | `{channel_id, content}` 发送频道消息 |
| 客户端→服务器 | `join_channel` / `leave_channel` | 加入/离开频道房间 |
| 客户端→服务器 | `friend_request_sent` | 通知对方有新好友申请 |
| 服务器→客户端 | `new_private_message` | 收到新的私聊消息 |
| 服务器→客户端 | `new_channel_message` | 收到新的频道消息 |
| 服务器→客户端 | `friend_request_notification` | 收到好友申请通知 |

#### 连接方式

```js
// 前端连接 WebSocket
import { io } from 'socket.io-client';
const socket = io('', { auth: { token: 'JWT_TOKEN' } });
```

---

## 五、后端 API 接口

> 所有接口前缀 `/api`，返回格式 `{ code: 0, data: ..., message: "..." }`

### 5.1 认证 (auth.js)

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/auth/register` | 否 | 邮箱 + 验证码注册 |
| POST | `/api/auth/login` | 否 | 邮箱 / UID + 密码登录 |
| GET | `/api/auth/me` | JWT | 获取当前用户信息 |
| PUT | `/api/auth/profile` | JWT | 修改用户资料 |
| GET | `/api/auth/stats` | JWT | 账户活跃统计 |
| POST | `/api/auth/forgot-password` | 否 | 发送重置密码验证码 |
| POST | `/api/auth/reset-password` | 否 | 验证码 + 新密码重置 |
| POST | `/api/auth/change-email` | JWT | 修改邮箱（需新邮箱验证码） |
| DELETE | `/api/auth/account` | JWT | 注销账号 |
| POST | `/api/auth/create-test-user` | localhost | 创建测试用户（管理接口） |

### 5.2 验证码 (verify.js)

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/verify/send-code` | 否 | 发送邮箱验证码 |

### 5.3 OAuth 第三方登录 (oauth.js)

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/oauth/qq/url` | 否 | 获取 QQ OAuth 授权 URL |
| GET | `/api/oauth/qq/callback` | 否 | QQ OAuth 回调（需配到 QQ 互联） |
| GET | `/api/oauth/wechat/url` | 否 | 获取微信扫码授权 URL |
| GET | `/api/oauth/wechat/callback` | 否 | 微信 OAuth 回调 |

### 5.4 工具集市 (tools.js)

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/tools` | 否 | 工具列表（支持 `?category=` 过滤） |
| POST | `/api/tools` | JWT | 上传新工具（multipart/form-data） |
| POST | `/api/tools/:id/download` | 否 | 下载计数 +1 |

### 5.5 社区动态 (community.js)

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/community/activities` | 否 | 社区动态列表（最新 50 条） |
| POST | `/api/community/post` | JWT | 发表动态（敏感词校验） |

### 5.6 AI 对话 (ai.js)

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/ai/chat` | JWT | AI 对话（支持 Function Calling） |

### 5.7 文件上传 (upload.js)

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/upload/avatar` | JWT | 上传头像（png/jpg/gif/webp, ≤ 2MB） |

### 5.8 反馈系统 (feedback.js)

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/feedback` | 可选 | 提交反馈 / 举报 |
| GET | `/api/feedback` | JWT | 查看反馈列表 |

### 5.9 社交系统 (social.js)

> 需要 JWT 认证。所有接口前缀 `/api/social`

**好友系统**

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/social/users/search?q=` | 按 UID/用户名搜索用户（排除自己） |
| POST | `/api/social/friend/request` | `{to_uid}` 发送好友申请（若对方已申请过则自动互加） |
| GET | `/api/social/friend/requests` | 查看我收到的待审批好友申请 |
| GET | `/api/social/friend/sent-requests` | 我发出的好友申请状态 |
| POST | `/api/social/friend/respond` | `{request_id, action}` 回应申请（accept/reject） |
| GET | `/api/social/friends` | 好友列表（含未读消息数） |
| DELETE | `/api/social/friend/:friendId` | 删除好友 |

**私聊**

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/social/messages/:userId` | 聊天记录（分页，每页50条） |
| GET | `/api/social/conversations` | 会话列表（含未读数、最后一条消息） |

**频道**

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/social/channels` | `{name, description, avatar}` 创建频道 |
| GET | `/api/social/channels` | 我加入的频道列表 |
| GET | `/api/social/channels/discover?q=` | 发现/搜索公开频道 |
| POST | `/api/social/channels/:id/join` | 加入频道 |
| POST | `/api/social/channels/:id/leave` | 退出频道 |
| GET | `/api/social/channels/:id/members` | 频道成员列表 |
| GET | `/api/social/channels/:id/messages` | 频道消息历史（分页） |
| POST | `/api/social/channels/:id/kick` | 踢出成员（管理员） |
| DELETE | `/api/social/channels/:id` | 解散频道（创建者） |

### 5.10 其他

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/health` | 否 | 健康检查 |

---

## 六、第三方 SDK / 集成

### 6.1 QQ 互联（QQ OAuth）

- **AppID**：`1112437361`
- **回调地址**：`http://bitopen.online/api/oauth/qq/callback`
- **包名**：`com.zhimaquan.app`
- **MD5 签名**：`1da0907dd9a79067fdd8109ed06a59c2`
- **配置位置**：`server/.env`（`QQ_APPID`、`QQ_SECRET`）

### 6.2 微信开放平台

- **SDK**：`@capgo/capacitor-wechat`（APP 端）
- **配置位置**：`server/.env`（`WECHAT_APPID`、`WECHAT_SECRET`）

### 6.3 阿里云 DashScope（AI）

- **对话模型**：qwen-plus（Function Calling 模式）
- **文生图**：通义万相 2.1（异步生成，轮询最多 60s）
- **配置**：API Key 在 `server/routes/ai.js` 和 `server/tools/imagegen.js` 中硬编码

### 6.4 邮箱服务

- **SMTP**：QQ 邮箱（smtp.qq.com:465）
- **用途**：验证码邮件、反馈通知
- **发件人**：`3487228292@qq.com`

### 6.5 Capacitor 插件

| 插件 | 用途 |
|------|------|
| `@capacitor/app` | App 生命周期管理、返回按钮手势控制 |
| `@capacitor/browser` | 调用系统浏览器处理 OAuth 登录 |
| `@capacitor/status-bar` | 状态栏颜色和样式控制 |
| `@capgo/capacitor-wechat` | 微信 SDK 封装 |

---

## 七、隐私政策

> 完整版：http://bitopen.online/privacy.html

**信息收集**：仅在注册时收集邮箱地址；第三方登录（QQ/微信）仅获取昵称和头像。

**信息使用**：
- 账号注册、登录与身份验证
- 社区内展示公开个人资料（昵称、头像）
- 发送必要的服务通知

**第三方共享**：不向任何第三方出售或分享个人信息。QQ/微信登录受各自隐私政策约束。

**用户权利**：
- 可随时修改个人信息
- 自助注销：应用内「账号设置」→「注销账号」
- 联系注销：support@bitopen.online
- 注销后立即删除全部个人数据

**联系我们**：support@bitopen.online

---

## 八、构建与部署

### 8.1 本地开发

```bash
# 前端开发（端口 5173）
npm install
npm run dev

# 后端开发（端口 3001）
cd server && npm install && node index.js
```

### 8.2 生产构建

```bash
# 前端构建
npx vite build              # 输出到 dist/

# Android APK 打包
npx cap sync android
cd android
./gradlew assembleRelease  # 需要 JDK 21 + Android SDK 36

# 签名（使用 apksigner）
apksigner sign --ks codestrong.keystore --ks-key-alias zhimaquan \
  --out 智码圈-v1.1.4.apk app-release-unsigned.apk
```

### 8.3 服务器部署

- **服务器**：134.175.18.44（4核4G Windows Server）
- **架构**：Nginx 反向代理 → `127.0.0.1:3001` → Node.js Express
- **部署路径**：`/opt/code-strong/`
- **进程管理**：PM2（进程名 `code-strong`）

```bash
# 部署后重启
scp -r dist/* server/* root@134.175.18.44:/opt/code-strong/
pm2 restart code-strong --update-env
```

---

## 九、数据库

使用 **sql.js**（SQLite 的 WASM 编译版本），纯 JavaScript 实现，无需安装原生 SQLite。

- **数据库文件**：`server/data.db`
- **重要**：每次写操作后需调用 `saveDatabase()` 持久化到磁盘
- **数据量小**（< 5MB），适合嵌入部署

### 表结构

| 表名 | 用途 |
|------|------|
| `users` | 用户表（id, username, email, password_hash, uid, avatar, bio 等） |
| `verification_codes` | 邮箱验证码（含过期时间） |
| `tools` | 工具集市 |
| `community_activities` | 社区动态 |
| `login_logs` | 登录日志 |
| `feedbacks` | 用户反馈 |
| `friend_requests` | 好友申请（from_user_id, to_user_id, status） |
| `friends` | 好友关系（双向记录） |
| `private_messages` | 私聊消息（含 is_read 标记） |
| `channels` | 频道（name, description, creator_id） |
| `channel_members` | 频道成员（role: member/admin） |
| `channel_messages` | 频道消息 |

> **WebSocket 依赖**：`socket.io@4`（服务端），`socket.io-client@4`（前端）
> 私聊和频道消息的实时推送通过 Socket.IO 实现，与 Express 共享同一 HTTP 端口（3001）。

---

## 十、注意事项

1. **API Key 安全**：阿里云 DashScope Key、SMTP 密码、QQ/微信 OAuth 密钥明文存储在 `server/.env`，生产环境建议迁移到环境变量管理
2. **JDK 版本**：Android 构建需要 JDK 21（`C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot`）
3. **App ID 差异**：Android 用 `com.zhimaquan.app`，iOS 用 `com.codestrong.app`
4. **登录方式**：仅支持邮箱或 UID 登录，不支持纯用户名登录
5. **数据库持久化**：sql.js 每次写操作需手动 `saveDatabase()`，服务异常退出可能导致数据丢失
6. **iOS 构建**：需 macOS 环境，可使用 GitHub Actions 云端构建（`.github/workflows/ios-build.yml`）或本地 `ios/build.sh`
7. **MuMu 模拟器**：ADB 连接地址 `127.0.0.1:7555`

---

## 十一、联系方式

- **官网**：http://bitopen.online
- **邮箱**：support@bitopen.online
- **APP 下载**：http://bitopen.online/download/zhimaquan.apk

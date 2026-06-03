# 码坚强 iOS 构建 + 安装指南

> 无需 Mac，无需付费开发者账号，一键装到你自己的 iPhone 上。

---

## 快速方案：Sideloadly（推荐 👍）

```
GitHub Actions (免费 macOS) 构建 IPA
         ↓
   下载 IPA 到 Windows
         ↓
   Sideloadly 用你的普通 Apple ID 签名
         ↓
   USB/WiFi 安装到 iPhone
         ↓
   7 天有效 → Sideloadly 自动续签
```

### 前置准备

| 东西 | 需要 |
|------|------|
| 普通 Apple ID | 就是你在 iPhone 上登录的那个账号 |
| iPhone + USB 数据线 | 连接电脑 |
| Windows 电脑 | 你现在用的这台 |
| iTunes / Apple Devices | 给 iPhone 装驱动 |

### 第一步：触发构建

1. 打开 https://github.com/DinanGqing/code-strong/actions
2. 左侧点 **iOS Build**
3. 点 **Run workflow** → 构建类型选 **sideloadly** → 绿色按钮 **Run workflow**
4. 等 5-8 分钟构建完成

### 第二步：下载 IPA

构建完后，在 Actions 详情页底部 **Artifacts** 下载 `码坚强-sideloadly-xxxxx.zip`，解压得到 `.ipa` 文件。

### 第三步：安装 Sideloadly

1. 下载 Sideloadly：https://sideloadly.io/
2. 安装 → 打开

### 第四步：签名 + 安装到 iPhone

1. iPhone 用 USB 连上电脑，**信任此电脑**
2. 打开 Sideloadly：
   - **IPA 文件**：拖入刚下载的 `App.ipa`
   - **Apple ID**：填你的普通 Apple ID（不需要开发者账号）
   - 点 **Start**
3. 第一次会让你输入 Apple ID 密码（用于生成临时签名证书，Sideloadly 不会存储）
4. 等几分钟，App 就出现在 iPhone 桌面了

### 第五步：保持不过期

- 签名有效期 **7 天**
- 到期前 iPhone 和电脑在同一个 WiFi 下，Sideloadly 可以 **自动续签**
- 或者到期前重新执行一次上面的安装步骤

### ⚠️ 注意事项

- 这是个人自用方案，**不能分发**给其他人
- 如果 Apple ID 开了两步验证，Sideloadly 需要 App-Specific Password
  - 到 https://appleid.apple.com → Sign-In and Security → App-Specific Passwords → 生成一个

---

## 方案二：付费开发者账号（正式发布用）

> 需要：$99/年 Apple Developer Program + macOS

### 构建方式

#### 本地 Mac

```bash
chmod +x ios/build.sh
./ios/build.sh
```

#### GitHub Actions

先用方案一的方式触发构建，构建类型选 `ad-hoc` 或 `app-store`。

但需要在 GitHub 设置 4 个 Secrets：`APPSTORE_CONNECT_API_KEY_BASE64`、`APPSTORE_CONNECT_KEY_ID`、`APPSTORE_CONNECT_ISSUER_ID`、`APPLE_TEAM_ID`。

详见 https://appstoreconnect.apple.com/access/api 创建 API Key。

---

## App Store 上架清单

- [ ] AppIcon（已配置 1024x1024）
- [ ] 启动图（已配置 Splash）
- [ ] 隐私政策 URL
- [ ] 应用描述 + 截图（6.7"/6.5"/5.5" 各 3-5 张）
- [ ] 年龄分级
- [ ] 版权信息

---

## 文件说明

| 文件 | 作用 |
|------|------|
| `capacitor.config.json` | Capacitor 总配置 |
| `ios/App/App.xcodeproj/` | Xcode 项目 |
| `ios/App/App/Info.plist` | iOS 权限 + 配置清单 |
| `ios/ExportOptions.plist` | 签名导出配置（CI 自动生成） |
| `ios/release.xcconfig` | Release 签名编译配置 |
| `ios/debug.xcconfig` | Debug 编译配置 |
| `ios/build.sh` | macOS 一键构建脚本 |
| `.github/workflows/ios-build.yml` | GitHub Actions 自动构建工作流 |

---
name: statusbar-dark-light-fix
description: "Android StatusBar 浅色/深色模式文字颜色适配修复技能。此技能用于当 APP 端切换浅色/深色主题时，状态栏文字颜色（时间/信号/电量等）未能正确跟随主题变化的问题。Capacitor 的 StatusBar.setStyle() API 在国产 ROM（MIUI/Flyme）上可能被系统 UI 覆盖，需用原生 JS Bridge 兜底。触发词：状态栏、StatusBar、文字颜色、浅色模式看不见、深色模式看不清。"
agent_created: true
---

# StatusBar 浅色/深色模式文字颜色适配

## 问题描述

APP 端切换浅色/深色模式时，状态栏文字颜色不跟随主题变化：
- **浅色模式** × 白色背景 + 白色文字（看不见）
- **深色模式** ✓ 深色背景 + 白色文字（通常正常，但也是由相同机制控制）

## 根因

国产 ROM（小米 MIUI、魅族 Flyme）对系统状态栏 API 做了定制化，`@capacitor/status-bar` 的 `StatusBar.setStyle()` 在这些设备上可能被系统 UI 覆盖，导致文字颜色切换不生效。

## 解决方案：双保险策略

```
themeMode 切换
  → Capacitor StatusBar.setStyle()           (标准路径，普通 ROM 生效)
  → window.AppStatusBar.setLightStatusBars()  (原生兜底，系统级 API，ROM 无法拦截)
```

### 核心原则（⚠️ 铁律）

1. **`overlay` 必须用 `false`** — `setOverlaysWebView({ overlay: true })` 会破坏深色模式。**绝对不要改！**
2. **必须同时使用 Capacitor API + 原生 Bridge** — 两者缺一不可。Capacitor 覆盖标准设备，Bridge 覆盖国产 ROM。
3. **Bridge 调用必须加重试机制** — JS 端注册时 WebView 可能尚未就绪，需要最多 10 次、间隔 100ms 的重试。
4. **修改 MainActivity.java 后**，执行 `npx cap sync android` 同步 Java 源文件，再执行 `./gradlew assembleRelease`。
5. **Android 11+ 和 6-10 要分别处理**：前者用 `WindowInsetsController`，后者用 `SYSTEM_UI_FLAG_LIGHT_STATUS_BAR`。

## 修改的文件

### 文件1: `android/app/src/main/java/com/zhimaquan/app/MainActivity.java`

添加 `@JavascriptInterface` 桥接类：

```java
private class StatusBarBridge {
    @JavascriptInterface
    public void setLightStatusBars(final boolean light) {
        runOnUiThread(() -> {
            // Android 11+ (API 30+): 使用 WindowInsetsController
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                WindowInsetsController insetsController = window.getInsetsController();
                insetsController.setSystemBarsAppearance(
                    light ? WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS : 0,
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                );
            }
            // Android 6-10 (API 23-29): 使用 SYSTEM_UI_FLAG
            else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                int flags = decorView.getSystemUiVisibility();
                if (light) flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                else flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                decorView.setSystemUiVisibility(flags);
            }
        });
    }
}
```

在 `onCreate` 中注册：
```java
webView.addJavascriptInterface(new StatusBarBridge(), "AppStatusBar");
```

### 文件2: `src/app/App.jsx`

```javascript
useEffect(() => {
  let cancelled = false;
  const updateStatusBar = async () => {
    // 1. Capacitor 标准 API
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    StatusBar.setOverlaysWebView({ overlay: false });  // ← 绝对不能用 true
    if (mode === 'dark') {
      StatusBar.setStyle({ style: Style.Light });
      StatusBar.setBackgroundColor({ color: '#0d0d2b' });
    } else {
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setBackgroundColor({ color: '#ffffff' });
    }

    // 2. 原生 JS Bridge 兜底（带重试）
    const tryBridge = (attempt = 0) => {
      if (cancelled) return;
      if (window.AppStatusBar) {
        // light=true → 浅色状态栏（深色文字），用于浅色模式
        // light=false → 深色状态栏（白色文字），用于深色模式
        window.AppStatusBar.setLightStatusBars(mode !== 'dark');
      } else if (attempt < 10) {
        setTimeout(() => tryBridge(attempt + 1), 100);
      }
    };
    tryBridge();
  };
  updateStatusBar();
  return () => { cancelled = true; };
}, [mode]);
```

## 构建部署流程

```bash
# 1. 构建 APP 前端
npx vite build --config vite.config.app.js

# 2. 同步 Capacitor（含 Java 源文件）
npx cap sync android

# 3. 构建 APK（含 Java 编译）
cd android && ./gradlew assembleRelease

# 4. 安装到手机
adb -s [设备序列号] install -r android/app/build/outputs/apk/release/app-release.apk
```

## 验证方法

1. 打开 APP
2. 切换到浅色模式 → 状态栏背景白色，文字深色 ✅
3. 切换到深色模式 → 状态栏背景深蓝色，文字白色 ✅
4. 反复切换 2-3 次确认无异常

## 常见陷阱

- ❌ **不要**使用 `setOverlaysWebView({ overlay: true })` — 会导致深色模式状态栏文字也不显示
- ❌ **不要**只在 MainActivity.java 中加桥接而不加 JS 调用 — 桥接提供了通道，但需要 JS 主动调用
- ❌ **不要**一次性写太多 import — `android.view.WindowInsetsController` 需要 Android 11+，编译时需处理
- ⚠️ `build.gradle` 中 `compileSdk` 需 >= 30 才能编译 `WindowInsetsController`
- ⚠️ 如果 APK 安装了但 JS Bridge 不生效，检查是否漏了 `npx cap sync android`

# StatusBar 浅色模式文字颜色修复记录

> 日期：2026-06-05 | 版本：v1.1.5

## 问题描述

APP端切换浅色/深色模式时，状态栏（StatusBar）的文字颜色没有跟随主题变化：
- **浅色模式**：白色背景 + 白色文字（看不见）
- **深色模式**：深色背景 + 白色文字（正常）

## 修复历程（打了3轮）

### 第1轮：Capacitor 标准 API（失败）

使用 `@capacitor/status-bar` 的 `setStyle()` 方法：

```js
StatusBar.setOverlaysWebView({ overlay: false });
if (mode === 'dark') {
  StatusBar.setStyle({ style: Style.Light });      // 白色文字
  StatusBar.setBackgroundColor({ color: '#0d0d2b' });
} else {
  StatusBar.setStyle({ style: Style.Dark });        // 深色文字
  StatusBar.setBackgroundColor({ color: '#f0f0f0' });
}
```

**结果**：深色模式正常，浅色模式 `Style.Dark` 在小米/魅族手机上不生效。原因：国产ROM（MIUI/Flyme）对系统状态栏API做了定制化，Capacitor插件无法覆盖。

### 第2轮：overlay: true 方案（搞砸了）

把 `setOverlaysWebView({ overlay: true })`，试图让JS完全控制状态栏渲染。

**结果**：**两个模式都坏了**。`overlay: true` 让系统状态栏管理方式完全改变，连之前正常的深色模式也失效了。

### 第3轮：原生 JS Bridge 兜底（最终修复 ✅）

**核心思路**：在 Java 层用 `@JavascriptInterface` 暴露原生 API，JS端的 `window.AppStatusBar.setLightStatusBars()` 直接调用系统级API设置状态栏文字颜色。

**双保险策略**：
```
themeMode 切换
  → Capacitor StatusBar.setStyle()          (标准路径，普通 ROM 上工作)
  → window.AppStatusBar.setLightStatusBars() (原生兜底，不受 ROM 限制)
```

### 原生桥接代码（MainActivity.java）

```java
private class StatusBarBridge {
    @JavascriptInterface
    public void setLightStatusBars(final boolean light) {
        runOnUiThread(() -> {
            // Android 11+ (API 30+): WindowInsetsController（新API，更可靠）
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                WindowInsetsController insetsController = window.getInsetsController();
                if (insetsController != null) {
                    if (light) {
                        insetsController.setSystemBarsAppearance(
                            WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS,
                            WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                        );
                    } else {
                        insetsController.setSystemBarsAppearance(
                            0,
                            WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                        );
                    }
                }
            }
            // Android 6-10 (API 23-29): SYSTEM_UI_FLAG（兼容旧版本）
            else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                int flags = decorView.getSystemUiVisibility();
                if (light) {
                    flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                } else {
                    flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                }
                decorView.setSystemUiVisibility(flags);
            }
        });
    }
}
```

### JS 端调用（带重试）

```js
const tryBridge = (attempt = 0) => {
    if (window.AppStatusBar) {
        window.AppStatusBar.setLightStatusBars(mode !== 'dark');
    } else if (attempt < 10) {
        setTimeout(() => tryBridge(attempt + 1), 100);
    }
};
```

## 总结

| 模式 | 背景色 | 文字颜色 | 系统 API |
|------|--------|---------|---------|
| 浅色模式 | `#ffffff` 白色 | **深色**（Style.Dark / LIGHT_STATUS_BARS） | Capacitor + 原生双保险 |
| 深色模式 | `#0d0d2b` 深蓝 | **白色**（Style.Light） | Capacitor + 原生双保险 |

## 关键教训

1. 不要在已经正常工作的模式上做实验 — `overlay: true` 破坏了深色模式
2. 国产ROM上不要只依赖Capacitor插件，原生层兜底才是最终方案
3. Android 11+ 要用 `WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS`，旧版用 `SYSTEM_UI_FLAG_LIGHT_STATUS_BAR`
4. JS Bridge 注册可能有时序问题，加重试机制
5. 修改 MainActivity.java 后需要 `npx cap sync android` 同步到 Android 项目目录

---
name: mobile-chat-layout
description: React + MUI 移动端聊天页面完整布局方案 — 解决消息列表滚动裁切、输入框键盘适配、底部导航栏联动隐藏等核心问题。基于 flex 布局 + custom event 架构，兼容 Capacitor WebView。
agent_created: true
---

# Mobile Chat Layout — 移动端聊天页面完整布局方案

## 概述

在 React + MUI 移动端（Capacitor WebView）中构建聊天页面时，会遇到一系列经典问题：
- 消息列表滚动时顶部/底部被裁切
- 输入框用 `position: fixed` 导致 flex 布局无法正确计算高度
- 键盘弹起时底部导航栏未隐藏，输入框离键盘太远
- flex 容器内 `overflow: auto` 吃 padding
- 底部灰色间隙

本技能提供一套经过实战验证的完整解决方案。

## 核心架构

### 1. 整体布局：flex + normal flow（非 fixed）

**错误做法**：输入框用 `position: fixed; bottom: 76px`，消息列表用 `flex: 1` 估算高度。

**正确做法**：全部放入 normal flow flex 列：

```jsx
<Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
  {/* 消息列表 */}
  <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
    {messages.map(...)}
  </Box>
  
  {/* 输入框 */}
  <Box sx={{ flexShrink: 0 }}>
    <TextField />
  </Box>
</Box>
```

**关键点**：
- `minHeight: 0` — **必须设置**，否则 flex 子元素不会收缩，消息列表会撑破父容器
- `overflow: 'hidden'` 在外层，保证内容不溢出
- 输入框 `flexShrink: 0` 防止被挤压

### 2. 消息列表顶部间距（避坑）

**坑**：在 `overflow: auto` 容器中使用 `display: flex + gap` 时，`padding-top` 可能被浏览器裁切。

**解法**：用普通 block 布局 + CSS 选择器控制间距：

```jsx
<Box
  ref={listRef}
  sx={{
    flex: 1, minHeight: 0, overflowY: 'auto',
    px: 2, pb: 2,
    '& > *:first-of-type': { mt: 7 },  // 第一条消息顶部 56px
    '& > * + *': { mt: 2 },             // 消息间 16px
  }}
>
```

### 3. 输入框底部间距（闲置 vs 键盘）

输入框底部需要动态间距：
- **闲置时**：留出导航栏高度（~56px）
- **键盘弹起时**：仅留 8px 贴边

```jsx
const [focused, setFocused] = useState(false);

<Box sx={{ flexShrink: 0 }}>
  <Box sx={{ px: 2, py: 1.5, pb: focused ? '8px' : '56px' }}>
    <TextField
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  </Box>
</Box>
```

### 4. 输入框底部无灰边

将 `background` 放在外层 wrapper 而非内层，让背景色覆盖到导航栏上方：

```jsx
<Box sx={{
  flexShrink: 0,
  borderTop: '1px solid rgba(0,0,0,0.06)',
  background: '#ffffff',           // 外层背景
  backdropFilter: 'blur(20px)',
}}>
  <Box sx={{ px: 2, py: 1.5, pb: '56px' }}>
    <TextField />                    // 内层只负责 padding
  </Box>
</Box>
```

### 5. 键盘弹起时隐藏底部导航栏

**核心问题**：`document.body.classList.add('keyboard-open')` 不会触发 React 组件重渲染。

**解决方案**：自定义事件 + forceUpdate

**AIAssistant 端**（发送事件）：
```jsx
useEffect(() => {
  if (focused) {
    document.body.classList.add('keyboard-open');
  } else {
    document.body.classList.remove('keyboard-open');
  }
  window.dispatchEvent(new Event('keyboardStateChange'));
  return () => {
    document.body.classList.remove('keyboard-open');
    window.dispatchEvent(new Event('keyboardStateChange'));
  };
}, [focused]);
```

**BottomNav 端**（监听事件）：
```jsx
import { useState, useEffect } from 'react';

export default function BottomNav() {
  const [, forceUpdate] = useState(0);
  
  useEffect(() => {
    const handler = () => forceUpdate((n) => n + 1);
    window.addEventListener('keyboardStateChange', handler);
    return () => window.removeEventListener('keyboardStateChange', handler);
  }, []);

  const shouldHide = document.body.classList.contains('keyboard-open');
  if (shouldHide) return null;
  
  return (/* 导航栏 UI */);
}
```

### 6. App.jsx 中 AI 路由的容器设置

```jsx
// App.jsx
<Box component="main" sx={{
  flex: 1,
  paddingTop: '8px',
  paddingBottom: '80px',  // 为底部导航栏预留
  overflow: 'hidden',
}}>
  <Box sx={{ height: '100%', overflow: 'hidden' }}>
    <Box sx={{ height: '100%', overflowY: 'auto' }}>
      <Routes>
        <Route path="/ai" element={
          <Box sx={{ height: '100%', overflow: 'hidden', position: 'relative' }}>
            <AIAssistant />
          </Box>
        } />
      </Routes>
    </Box>
  </Box>
</Box>
```

## 完整代码模板

将以上各部分组合即可得到一个完整的、生产就绪的聊天页面布局。

## 涉及文件

| 文件 | 作用 |
|------|------|
| `src/app/pages/AIAssistant.jsx` | 聊天主页面 |
| `src/app/components/BottomNav.jsx` | 底部导航栏 |
| `src/app/App.jsx` | 路由容器 |

## 兼容性

- ✅ React 18 + MUI v5 + Capacitor WebView
- ✅ iOS Safari / Android Chrome WebView
- ✅ 深色/浅色模式
- ✅ 安全区域（safe-area-inset）

package com.zhimaquan.app;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        WindowCompat.setDecorFitsSystemWindows(window, false);

        // 注册原生 JS Bridge（延迟到 WebView 可用后）
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.addJavascriptInterface(new StatusBarBridge(), "AppStatusBar");
        }
    }

    /**
     * JS → Native 状态栏控制桥接
     * 调用方式: window.AppStatusBar.setLightStatusBars(true/false)
     *
     * true  = 浅色状态栏（图标/文字为深色）→ 用于浅色模式
     * false = 深色状态栏（图标/文字为白色）→ 用于深色模式
     */
    private class StatusBarBridge {
        @JavascriptInterface
        public void setLightStatusBars(final boolean light) {
            runOnUiThread(() -> {
                Window window = getWindow();
                if (window == null) return;

                // Android 11+ (API 30+): 使用 WindowInsetsController
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
                // Android 6-10 (API 23-29): 使用 SYSTEM_UI_FLAG
                else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    View decorView = window.getDecorView();
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
}

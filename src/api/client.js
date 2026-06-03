import axios from 'axios';

/**
 * Axios 实例，baseURL 指向 /api，通过 Vite proxy 转发到后端
 */
// 判断运行环境：APK / 浏览器开发 / 浏览器访问线上
const isNativeApp = typeof window !== 'undefined' && (
  window.Capacitor !== undefined ||
  window.location.protocol === 'capacitor:' ||
  (window.location.hostname === 'localhost' && !window.location.port)
);

const isDevServer = typeof window !== 'undefined' &&
  window.location.hostname === 'localhost' &&
  window.location.port === '5173';

const API_BASE = isNativeApp || isDevServer
  ? 'http://bitopen.online/api'   // 服务器 443 不通，走 80
  : '/api';

if (typeof window !== 'undefined') {
  console.log('[API] origin:', window.location.origin, '→ API:', API_BASE);
}

const client = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 请求拦截器：自动附加 JWT Bearer Token
 */
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * 响应拦截器：统一处理 401，清除登录态并跳转
 */
client.interceptors.response.use(
  (response) => {
    // 直接返回 data，调用方拿到的是 { code, data, message }
    return response.data;
  },
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        // Token 失效或未登录，清除本地状态
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // 触发全局 auth 失效事件，由 AuthContext 监听处理
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
      return error.response.data;
    }
    // 网络错误等
    return { code: -1, data: null, message: '网络连接失败，请检查网络' };
  }
);

export default client;

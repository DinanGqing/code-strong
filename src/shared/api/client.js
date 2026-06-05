import axios from 'axios';

/**
 * Axios 实例
 * - Web 端（VITE_PLATFORM=web）→ `/api`（同源代理）
 * - APP 端（VITE_PLATFORM=app）→ `https://bitopen.online/api`（直连服务器）
 * - Dev 模式 → `/api`（走 Vite proxy 到 localhost:3001）
 */
const IS_APP = import.meta.env.VITE_PLATFORM === 'app';
const API_BASE = IS_APP ? 'https://bitopen.online/api' : '/api';

console.log('[API] DEV:', import.meta.env.DEV, 'PLATFORM:', import.meta.env.VITE_PLATFORM, '→ API:', API_BASE);

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

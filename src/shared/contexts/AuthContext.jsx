import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authApi from '../api/auth';

/** @type {React.Context<{ user: object|null, token: string|null, loading: boolean, login: Function, register: Function, logout: Function }>} */
const AuthContext = createContext(null);

/**
 * 认证上下文 Provider
 * 管理全局 user/token 状态，localStorage 持久化
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * 初始化：从 localStorage 恢复登录状态
   */
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (_err) {
        // 数据损坏则清除
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  /**
   * 监听全局 auth:expired 事件（由 axios 拦截器在 401 时触发）
   */
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  /**
   * 登录
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{ code: number, message: string }>}
   */
  const login = useCallback(async (username, password) => {
    const res = await authApi.login(username, password);
    if (res.code === 0 && res.data) {
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
    }
    return res;
  }, []);

  /**
   * 注册
   * @param {string} username
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ code: number, message: string }>}
   */
  const register = useCallback(async (username, email, password, code) => {
    const res = await authApi.register(username, email, password, code);
    if (res.code === 0 && res.data) {
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
    }
    return res;
  }, []);

  /**
   * 登出
   */
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  /**
   * 更新用户信息（同步 state + localStorage）
   */
  const updateUser = useCallback((newData) => {
    setUser(prev => {
      const updated = { ...prev, ...newData };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value = {
    user, token, loading, login, register, logout, updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 使用认证上下文 Hook
 * @returns {{ user: object|null, token: string|null, loading: boolean, login: Function, register: Function, logout: Function }}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth 必须在 AuthProvider 内使用');
  }
  return context;
}

export default AuthContext;

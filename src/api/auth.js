import client from './client';

/**
 * 用户注册
 */
export async function register(username, email, password, code) {
  return client.post('/auth/register', { username, email, password, code });
}

/**
 * 用户登录
 */
export async function login(username, password) {
  return client.post('/auth/login', { username, password });
}

/**
 * 获取当前用户信息
 */
export async function getMe() {
  return client.get('/auth/me');
}

/**
 * 发送邮箱验证码
 */
export async function sendCode(email, type = 'register') {
  return client.post('/verify/send-code', { email, type });
}

/**
 * 找回密码（发送重置验证码）
 */
export async function forgotPassword(email) {
  return client.post('/auth/forgot-password', { email });
}

/**
 * 重置密码
 */
export async function resetPassword(email, code, newPassword) {
  return client.post('/auth/reset-password', { email, code, newPassword });
}

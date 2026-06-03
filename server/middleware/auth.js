import jwt from 'jsonwebtoken';

/**
 * JWT 认证中间件
 * 从 Authorization 头提取 Bearer Token，验证后设置 req.user
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 401,
      data: null,
      message: '未提供认证令牌',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        data: null,
        message: '认证令牌已过期，请重新登录',
      });
    }
    return res.status(401).json({
      code: 401,
      data: null,
      message: '无效的认证令牌',
    });
  }
}

/**
 * 可选 JWT 认证中间件
 * 如果请求带有有效 token 则设置 req.user，否则继续但不报错
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (_err) {
    // Token 无效时静默跳过，不阻塞请求
  }

  next();
}

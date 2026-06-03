import nodemailer from 'nodemailer';

let transporter = null;

/**
 * 初始化邮件发送器（SMTP）
 */
function getTransporter() {
  if (transporter) return transporter;

  // 如果配置了 SMTP，用真实邮箱发送；否则打印到控制台
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE !== 'false',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // 开发模式：打印验证码到日志，不真实发送
    transporter = null;
  }
  return transporter;
}

/**
 * 发送验证码邮件
 * @param {string} email 目标邮箱
 * @param {string} code  验证码
 * @param {string} type  'register' | 'reset'
 */
export async function sendVerificationCode(email, code, type = 'register') {
  const subject = type === 'register' ? '智码圈社区 - 注册验证码' : '智码圈社区 - 密码重置验证码';
  const action = type === 'register' ? '注册' : '重置密码';
  const html = `
    <div style="max-width:500px;margin:0 auto;padding:30px;font-family:Arial,sans-serif;background:#0a0a1a;color:#e0e0e0;border-radius:12px;border:1px solid rgba(0,212,255,0.2)">
      <h2 style="color:#00D4FF;text-align:center">💪 智码圈社区</h2>
      <p style="font-size:16px">你正在${action}智码圈账号，验证码如下：</p>
      <div style="background:rgba(0,180,216,0.1);border:1px solid rgba(0,212,255,0.3);border-radius:8px;padding:20px;text-align:center;margin:20px 0">
        <span style="font-size:36px;font-weight:bold;color:#00D4FF;letter-spacing:8px">${code}</span>
      </div>
      <p style="color:#a0a0b0;font-size:13px">验证码 5 分钟内有效，请勿泄露给他人。</p>
      <p style="color:#a0a0b0;font-size:13px">如果这不是你的操作，请忽略此邮件。</p>
    </div>
  `;

  const transport = getTransporter();

  if (transport) {
    await transport.sendMail({
      from: `"智码圈社区" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      html,
    });
    console.log(`[Email] 验证码已发送至 ${email}`);
  } else {
    // 开发模式：打印到控制台
    console.log(`\n📧 [DEV] 验证码已发送至 ${email}`);
    console.log(`📧 [DEV] 验证码: ${code}（${type === 'register' ? '注册' : '重置密码'}，5分钟有效）\n`);
  }

  return { success: true };
}

/**
 * 发送反馈通知邮件到管理员
 * @param {object} feedback { type, title, description, contact, username }
 */
export async function sendFeedbackNotification(feedback) {
  const { type, title, description, contact, username } = feedback;
  const transport = getTransporter();

  if (transport) {
    await transport.sendMail({
      from: `"码坚强反馈" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'support@bitopen.online',
      subject: `[用户反馈] ${type} - ${title}`,
      html: `
        <div style="max-width:500px;font-family:Arial,sans-serif;background:#0a0a1a;color:#e0e0e0;padding:20px;border-radius:8px">
          <h3 style="color:#00D4FF">📨 新用户反馈</h3>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="color:#a0a0b0;padding:4px 0">类型</td><td style="padding:4px 0">${type}</td></tr>
            <tr><td style="color:#a0a0b0;padding:4px 0">标题</td><td style="padding:4px 0"><strong>${title}</strong></td></tr>
            <tr><td style="color:#a0a0b0;padding:4px 0">用户</td><td style="padding:4px 0">${username || '匿名'}</td></tr>
            <tr><td style="color:#a0a0b0;padding:4px 0">联系方式</td><td style="padding:4px 0">${contact || '未填写'}</td></tr>
          </table>
          <div style="margin-top:12px;padding:12px;background:rgba(255,255,255,0.05);border-radius:6px;white-space:pre-wrap">${description}</div>
        </div>
      `,
    });
    console.log(`[Email] 反馈通知已发送至 ${process.env.ADMIN_EMAIL || 'support@bitopen.online'}`);
  } else {
    console.log(`\n📨 [DEV] 新反馈通知：${type} - ${title}`);
    console.log(`📨 [DEV] 用户：${username || '匿名'} | 联系：${contact || '无'}`);
    console.log(`📨 [DEV] 内容：${description}\n`);
  }
}

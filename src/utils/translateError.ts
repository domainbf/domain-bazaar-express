/**
 * Translates Supabase / network error messages from English to Chinese.
 * Add any new patterns here so they are handled site-wide.
 */
export function translateAuthError(message: string, fallback?: string): string {
  if (!message) return fallback || '操作失败，请重试';

  // Rate-limiting — "For security purposes, you can only request this after N seconds."
  const securityMatch = message.match(/you can only request this after (\d+) second/i);
  if (securityMatch) {
    return `操作过于频繁，请 ${securityMatch[1]} 秒后再试`;
  }

  const m = message.toLowerCase();

  if (m.includes('email rate limit exceeded'))          return '邮件发送过于频繁，请稍后再试';
  if (m.includes('rate limit'))                         return '请求过于频繁，请稍后再试';
  if (m.includes('rate limited'))                       return '操作过于频繁，请稍后再试';
  if (m.includes('too many requests'))                  return '请求过于频繁，请稍后再试';
  if (m.includes('email not confirmed'))                return '请先验证您的邮箱，然后再登录';
  if (m.includes('invalid login credentials'))          return '邮箱或密码错误，请检查后重试';
  if (m.includes('user already registered'))            return '该邮箱已被注册，请直接登录';
  if (m.includes('password should be'))                 return '密码至少需要6个字符';
  if (m.includes('new password should be different'))   return '新密码不能与当前密码相同';
  if (m.includes('auth session missing'))               return '登录状态已失效，请重新登录';
  if (m.includes('token has expired') || m.includes('otp has expired'))
                                                        return '验证码或链接已过期，请重新申请';
  if (m.includes('email link is invalid') || m.includes('link is invalid or has expired'))
                                                        return '邮件链接已失效，请重新申请';
  if (m.includes('invalid otp'))                        return '验证码不正确，请重新输入';
  if (m.includes('unable to validate email') || m.includes('email address is invalid'))
                                                        return '邮箱格式不正确';
  if (m.includes('user not found'))                     return '该账号不存在';
  if (m.includes('signup is disabled') || m.includes('signup disabled'))
                                                        return '注册功能暂时关闭，请联系管理员';
  if (m.includes('phone not confirmed'))                return '请先验证您的手机号';
  if (m.includes('network request failed') || m.includes('failed to fetch') || m.includes('networkerror'))
                                                        return '网络连接失败，请检查网络后重试';
  if (m.includes('edge function returned a non-2xx'))   return '服务暂时不可用，请稍后重试';
  if (m.includes('database error'))                     return '数据库错误，请稍后重试';
  if (m.includes('permission denied'))                  return '权限不足，操作被拒绝';
  if (m.includes('unique constraint'))                  return '该记录已存在，请勿重复提交';

  // If the message looks like it's already in Chinese (contains CJK characters), leave it
  if (/[\u4e00-\u9fff]/.test(message)) return message;

  return fallback || '操作失败，请重试';
}

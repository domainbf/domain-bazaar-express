
/**
 * 生成用于验证的随机令牌
 */
export const generateVerificationToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

/**
 * 格式化验证相关的错误消息
 */
export const formatVerificationError = (error: any): string => {
  console.error('Verification error:', error);
  return error.message || '验证过程中发生错误';
};


import { z } from 'zod';

export const domainNameSchema = z
  .string()
  .min(1, '域名不能为空')
  .regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/, '域名格式不正确');

export const priceSchema = z
  .number()
  .min(100, '价格不能低于100元')
  .max(10000000, '价格不能超过1000万元');

export const emailSchema = z
  .string()
  .email('邮箱格式不正确');

export const phoneSchema = z
  .string()
  .regex(/^1[3-9]\d{9}$/, '手机号格式不正确');

export const usernameSchema = z
  .string()
  .min(2, '用户名至少2个字符')
  .max(20, '用户名最多20个字符')
  .regex(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, '用户名只能包含字母、数字、下划线和中文');

export const validateDomainName = (name: string): { isValid: boolean; error?: string } => {
  try {
    domainNameSchema.parse(name);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message };
    }
    return { isValid: false, error: '验证失败' };
  }
};

export const validatePrice = (price: number): { isValid: boolean; error?: string } => {
  try {
    priceSchema.parse(price);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message };
    }
    return { isValid: false, error: '验证失败' };
  }
};

export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  try {
    emailSchema.parse(email);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message };
    }
    return { isValid: false, error: '验证失败' };
  }
};

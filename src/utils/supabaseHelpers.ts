
import { PostgrestError } from '@supabase/supabase-js';

export const handleSupabaseError = (error: PostgrestError | Error | null): string => {
  if (!error) return '';
  
  // Handle specific Supabase errors
  if ('code' in error) {
    switch (error.code) {
      case 'PGRST301':
        return '数据不存在或已被删除';
      case 'PGRST204':
        return '未找到相关数据';
      case '23505':
        return '数据已存在，无法重复创建';
      case '23503':
        return '相关数据不存在，操作失败';
      case '42501':
        return '权限不足，无法执行此操作';
      default:
        return error.message || '数据库操作失败';
    }
  }
  
  return error.message || '未知错误';
};

export const isSupabaseError = (error: any): error is PostgrestError => {
  return error && typeof error === 'object' && 'code' in error && 'message' in error;
};

export const retrySupabaseOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (i === maxRetries - 1) {
        throw lastError;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  
  throw lastError!;
};

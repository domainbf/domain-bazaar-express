import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { translateAuthError } from '@/utils/translateError';
import { apiPost } from '@/lib/apiClient';

export const signInWithEmailPassword = async (email: string, password: string) => {
  try {
    const data = await apiPost<{ accessToken: string; refreshToken: string; user: { id: string; email: string; is_admin: boolean }; profile: unknown }>('/auth/login', { email, password });
    return { success: true, data };
  } catch (error: unknown) {
    console.error('Login error:', error);
    return { success: false, error: error as Error };
  }
};

export const signUpWithEmailPassword = async (
  email: string,
  password: string,
  options?: { metadata?: Record<string, unknown>; redirectTo?: string }
) => {
  try {
    const data = await apiPost<{ accessToken: string; refreshToken: string; user: unknown; profile: unknown }>(
      '/auth/register',
      { email, password, full_name: options?.metadata?.full_name }
    );
    return { success: true, data };
  } catch (error: unknown) {
    const msg = (error as Error).message || '注册失败';
    // surface the duplicate-email case with the same message as before
    if (msg.includes('已注册')) {
      return { success: false, error: new Error('该邮箱已注册，请直接登录或使用「忘记密码」找回账户') };
    }
    return { success: false, error: error as Error };
  }
};

export const signOut = async () => {
  try {
    await apiPost('/auth/logout', {}).catch(() => {});
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error as Error };
  }
};

export const fetchUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const isHookTimeoutError = (_error: unknown): boolean => false;

export const resetUserPassword = async (email: string) => {
  try {
    await apiPost('/auth/request-reset', { email });
    return { success: true };
  } catch (error: unknown) {
    throw new Error((error as Error).message || '发送重置密码邮件失败');
  }
};

export const updateUserPassword = async (newPassword: string) => {
  try {
    await apiPost('/auth/change-password', { newPassword });
    return { success: true };
  } catch (error: unknown) {
    throw new Error((error as Error).message || 'Failed to update password');
  }
};

export const handleAuthError = (error: unknown, action: string) => {
  console.error(`Error during ${action}:`, error);
  const errorMessage = translateAuthError((error as Error)?.message || '', `${action}失败`);
  toast.error(errorMessage);
  throw error;
};

export const clearDemoData = async () => {
  return { success: true };
};

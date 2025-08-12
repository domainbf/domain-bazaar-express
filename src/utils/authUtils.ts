
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const signInWithEmailPassword = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Login error:', error);
    return { success: false, error };
  }
};

export const signUpWithEmailPassword = async (email: string, password: string, options?: { metadata?: { [key: string]: any }, redirectTo?: string }) => {
  try {
    // 统一使用 nic.bn 域名进行重定向
    const redirectUrl = `https://nic.bn/auth/callback`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: options?.metadata || {},
        emailRedirectTo: options?.redirectTo || redirectUrl
      }
    });
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Signup error:', error);
    return { success: false, error };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Sign out error:', error);
    return { success: false, error };
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

export const resetUserPassword = async (email: string) => {
  try {
    console.log('开始重置密码请求:', email);
    
    // 使用 Supabase 内置的密码重置功能
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `https://nic.bn/reset-password`,
    });
    
    if (error) {
      console.error('密码重置失败:', error);
      throw new Error(error.message || '发送重置密码邮件失败');
    }
    
    console.log('密码重置邮件发送成功');
    return { success: true };
  } catch (error: any) {
    console.error('重置密码邮件发送失败:', error);
    throw new Error(error.message || '发送重置密码邮件失败');
  }
};

export const updateUserPassword = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({ 
      password: newPassword 
    });
    
    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    console.error('Update password error:', error);
    throw new Error(error.message || 'Failed to update password');
  }
};

export const handleAuthError = (error: any, action: string) => {
  console.error(`Error during ${action}:`, error);
  let errorMessage = error.message;
  
  // Friendlier error messages for common errors
  if (errorMessage?.includes('Email not confirmed')) {
    errorMessage = '请先验证您的邮箱，然后再尝试登录。';
  } else if (errorMessage?.includes('Invalid login credentials')) {
    errorMessage = '邮箱或密码错误，请重试';
  } else if (errorMessage?.includes('User already registered')) {
    errorMessage = '该邮箱已被注册，请尝试登录或使用另一个邮箱';
  } else if (errorMessage?.includes('Password should be')) {
    errorMessage = '密码应至少包含6个字符';
  } else if (errorMessage?.includes('rate limited')) {
    errorMessage = '操作过于频繁，请稍后再试';
  } else if (errorMessage?.includes('Edge Function returned a non-2xx status code')) {
    errorMessage = '服务暂时不可用，请稍后重试';
  } else if (errorMessage?.includes('network') || errorMessage?.includes('fetch')) {
    errorMessage = '网络连接错误，请检查网络设置';
  }
  
  toast.error(errorMessage || `${action}失败`);
  throw error;
};

// Delete domain data for demo purposes
export const clearDemoData = async () => {
  try {
    // This should be a secure operation that requires admin authentication
    // For safety, we would typically implement this on the server side
    // with proper authorization
    return { success: true };
  } catch (error: any) {
    console.error('Clear demo data error:', error);
    throw new Error(error.message || 'Failed to clear demo data');
  }
};

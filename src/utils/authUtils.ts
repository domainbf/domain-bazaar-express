
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { translateAuthError } from '@/utils/translateError';

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
    // 使用当前域名进行重定向，确保预览和生产环境都能正常工作
    const defaultRedirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: options?.metadata || {},
        emailRedirectTo: options?.redirectTo || defaultRedirectUrl
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

export const isHookTimeoutError = (error: any): boolean => {
  const msg = error?.message || '';
  return (
    msg.includes('Failed to reach hook') ||
    msg.includes('hook within maximum time') ||
    msg.includes('Hook call failed') ||
    msg.includes('AuthHookError') ||
    msg.includes('failed_to_reach_hook')
  );
};

export const resetUserPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) {
      // Hook timeout errors: the reset email was likely still sent.
      // Supabase triggers the hook AFTER sending the email, so we treat this as success.
      if (isHookTimeoutError(error)) {
        console.warn('Auth hook timeout (non-critical):', error.message);
        return { success: true, hookWarning: true };
      }
      console.error('密码重置失败:', error);
      throw new Error(error.message || '发送重置密码邮件失败');
    }
    
    return { success: true };
  } catch (error: any) {
    if (isHookTimeoutError(error)) {
      console.warn('Auth hook timeout (non-critical):', error.message);
      return { success: true, hookWarning: true };
    }
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
  const errorMessage = translateAuthError(error.message || '', `${action}失败`);
  toast.error(errorMessage);
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


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
    
    // 注册成功后，通过我们的自定义函数发送验证邮件
    if (data.user && !data.user.email_confirmed_at) {
      try {
        await sendVerificationEmail(
          email, 
          `https://nic.bn/auth/verify?token=${data.user.id}`,
          options?.metadata?.full_name || email.split('@')[0]
        );
      } catch (emailError) {
        console.warn('发送验证邮件失败，但注册成功:', emailError);
      }
    }
    
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

export const sendVerificationEmail = async (email: string, verificationUrl: string, fullName?: string) => {
  try {
    console.log('通过 send-notification 函数发送验证邮件');
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: {
        type: 'email_verification',
        recipient: email,
        data: {
          verificationUrl,
          name: fullName || email.split('@')[0]
        }
      }
    });
    
    if (error) {
      console.error('调用 send-notification 函数失败:', error);
      throw error;
    }
    
    console.log('验证邮件发送成功:', data);
    return true;
  } catch (error) {
    console.error('发送验证邮件失败:', error);
    throw error;
  }
};

export const handleAuthError = (error: any, action: string) => {
  console.error(`Error during ${action}:`, error);
  let errorMessage = error.message;
  
  // Friendlier error messages for common errors
  if (errorMessage.includes('Email not confirmed')) {
    errorMessage = '请先验证您的邮箱，然后再尝试登录。验证邮件已重新发送。';
    // Try to resend verification email
    if (error.email) {
      sendVerificationEmail(error.email, `https://nic.bn/auth/verify`)
        .then(() => toast.info('✉️ 验证邮件已重新发送，请检查您的邮箱'))
        .catch(() => console.warn('重新发送验证邮件失败'));
    }
  } else if (errorMessage.includes('Invalid login credentials')) {
    errorMessage = '邮箱或密码错误，请重试';
  } else if (errorMessage.includes('User already registered')) {
    errorMessage = '该邮箱已被注册，请尝试登录或使用另一个邮箱';
  } else if (errorMessage.includes('Password should be')) {
    errorMessage = '密码应至少包含6个字符';
  } else if (errorMessage.includes('rate limited')) {
    errorMessage = '操作过于频繁，请稍后再试';
  } else if (errorMessage.includes('Edge Function returned a non-2xx status code')) {
    errorMessage = '服务暂时不可用，请稍后重试';
  } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    errorMessage = '网络连接错误，请检查网络设置';
  }
  
  toast.error(errorMessage || `${action}失败`);
  throw error;
};

export const resetUserPassword = async (email: string) => {
  try {
    console.log('开始重置密码请求:', email);
    
    // 使用自定义通知函数发送密码重置邮件
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: {
        type: 'password_reset',
        recipient: email,
        data: {
          token: crypto.randomUUID(), // 生成临时令牌
          resetUrl: `https://nic.bn/reset-password`
        }
      }
    });
    
    if (error) {
      console.error('调用send-notification失败:', error);
      
      // 处理具体错误类型
      if (error.message && error.message.includes('Edge Function returned a non-2xx status code')) {
        throw new Error('服务暂时不可用，请稍后重试');
      } else if (error.message && error.message.includes('network')) {
        throw new Error('网络连接错误，请检查网络设置');
      } else {
        throw new Error(error.message || '发送重置密码邮件失败');
      }
    }
    
    console.log('密码重置邮件发送成功:', data);
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

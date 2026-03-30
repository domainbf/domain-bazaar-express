
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const fetchUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return await createDefaultProfile(userId);
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const createDefaultProfile = async (userId: string, email?: string) => {
  try {
    const defaultProfile = {
      id: userId,
      full_name: email?.split('@')[0] || 'User',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_seller: false,
      seller_verified: false,
      total_sales: 0,
      verification_status: 'pending'
    };
    
    const { data, error } = await supabase
      .from('profiles')
      .insert(defaultProfile)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating default profile:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating default profile:', error);
    return null;
  }
};

export const sendVerificationEmail = async (email: string, verificationUrl: string, fullName?: string) => {
  try {
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
      console.error('Error invoking send-notification function:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

export const handleAuthError = (error: any, action: string) => {
  console.error(`Error during ${action}:`, error);
  let errorMessage = error.message || `${action}失败`;
  
  if (errorMessage.includes('Email not confirmed')) {
    errorMessage = '请先验证您的邮箱，然后再尝试登录。';
    if (error.email) {
      sendVerificationEmail(error.email, `${window.location.origin}/`)
        .then(() => toast.info('✉️ 验证邮件已重新发送，请检查您的邮箱'));
    }
  } else if (errorMessage.includes('Invalid login credentials')) {
    errorMessage = '邮箱或密码错误，请检查后重试';
  } else if (errorMessage.includes('User already registered')) {
    errorMessage = '该邮箱已被注册，请尝试登录或使用另一个邮箱';
  } else if (errorMessage.includes('Password should be')) {
    errorMessage = '密码应至少包含6个字符';
  } else if (errorMessage.includes('rate limited')) {
    errorMessage = '操作过于频繁，请稍后再试';
  } else if (errorMessage.includes('signup is disabled')) {
    errorMessage = '注册功能暂时关闭，请联系管理员';
  } else if (errorMessage.includes('email address is invalid')) {
    errorMessage = '邮箱地址格式不正确，请检查后重试';
  } else if (errorMessage.includes('Network request failed')) {
    errorMessage = '网络连接失败，请检查网络后重试';
  } else if (errorMessage.includes('fetch')) {
    errorMessage = '网络请求失败，请重试';
  }
  
  toast.error(errorMessage);
  throw new Error(errorMessage);
};

export const cleanupAuthState = () => {
  try {
    localStorage.removeItem('supabase.auth.token');
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    if (typeof sessionStorage !== 'undefined') {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          sessionStorage.removeItem(key);
        }
      });
    }
  } catch (error) {
    console.error('Error cleaning up auth state:', error);
  }
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 6) {
    return { isValid: false, message: '密码至少需要6个字符' };
  }
  
  if (password.length > 72) {
    return { isValid: false, message: '密码不能超过72个字符' };
  }
  
  return { isValid: true };
};

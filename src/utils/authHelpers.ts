
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { translateAuthError } from '@/utils/translateError';

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
  const raw = error.message || '';

  // Special case: email-not-confirmed → auto-resend verification
  if (raw.includes('Email not confirmed')) {
    const msg = '请先验证您的邮箱，然后再尝试登录。';
    if (error.email) {
      sendVerificationEmail(error.email, `${window.location.origin}/`)
        .then(() => toast.info('✉️ 验证邮件已重新发送，请检查您的邮箱'));
    }
    toast.error(msg);
    throw new Error(msg);
  }

  const errorMessage = translateAuthError(raw, `${action}失败`);
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

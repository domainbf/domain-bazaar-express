
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
    console.log('Sending verification email via send-notification function');
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
    
    console.log('Verification email response:', data);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

export const handleAuthError = (error: any, action: string) => {
  console.error(`Error during ${action}:`, error);
  let errorMessage = error.message;
  
  // Friendlier error messages for common errors
  if (errorMessage.includes('Email not confirmed')) {
    errorMessage = '请先验证您的邮箱，然后再尝试登录';
    // Try to resend verification email
    if (error.email) {
      sendVerificationEmail(error.email, `${window.location.origin}/auth/verify`)
        .then(() => toast.info('验证邮件已重新发送，请检查您的邮箱'));
    }
  } else if (errorMessage.includes('Invalid login credentials')) {
    errorMessage = '邮箱或密码错误，请重试';
  } else if (errorMessage.includes('User already registered')) {
    errorMessage = '该邮箱已被注册，请尝试登录或使用另一个邮箱';
  } else if (errorMessage.includes('Password should be')) {
    errorMessage = '密码应至少包含6个字符';
  } else if (errorMessage.includes('rate limited')) {
    errorMessage = '操作过于频繁，请稍后再试';
  }
  
  toast.error(errorMessage || `${action}失败`);
  throw error;
};

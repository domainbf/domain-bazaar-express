
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { fetchUserProfile, sendVerificationEmail, handleAuthError } from '@/utils/authHelpers';

export const signInUser = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    // Check if user has admin role in metadata
    const isAdmin = data?.user?.app_metadata?.role === 'admin';
    if (isAdmin) {
      console.log('Admin user logged in successfully');
    }
    
    toast.success('登录成功！');
    return true;
  } catch (error: any) {
    handleAuthError(error, '登录');
    return false;
  }
};

export const signUpUser = async (email: string, password: string, userData?: any) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    if (error) throw error;
    
    // Send custom verification email via Resend
    try {
      console.log('Sending verification email to:', email);
      const { error: notifError } = await supabase.functions.invoke('send-notification', {
        body: {
          type: 'email_verification',
          recipient: email,
          data: {
            verificationUrl: `${window.location.origin}/auth/verify?token=${data?.session?.access_token}`,
            name: userData?.full_name || email.split('@')[0]
          }
        }
      });
      
      if (notifError) {
        console.error('Error sending custom verification email:', notifError);
        throw notifError;
      }
      
      console.log('Verification email sent successfully');
    } catch (notifError) {
      console.error('Error sending verification email:', notifError);
      // Continue as Supabase will send its default email as fallback
    }
    
    toast.success('注册成功！请检查您的邮箱以完成验证。');
    return true;
  } catch (error: any) {
    handleAuthError(error, '注册');
    return false;
  }
};

export const signOutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    toast.success('已成功退出登录');
    return true;
  } catch (error: any) {
    handleAuthError(error, '退出登录');
    return false;
  }
};

export const resetUserPassword = async (email: string) => {
  try {
    // Update redirect URL to point directly to the reset password page
    const redirectTo = `${window.location.origin}/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    
    if (error) throw error;
    
    // Send custom password reset email
    try {
      console.log('Sending password reset email to:', email);
      const { error: invokeError } = await supabase.functions.invoke('send-notification', {
        body: {
          type: 'password_reset',
          recipient: email,
          data: {
            resetUrl: redirectTo,
            name: email.split('@')[0]
          }
        }
      });
      
      if (invokeError) {
        console.error('发送自定义密码重置邮件时出错:', invokeError);
        throw invokeError;
      }
      
      console.log('Password reset email sent successfully');
    } catch (invokeError) {
      console.error('发送密码重置邮件时出错:', invokeError);
      // Continue as Supabase will send its default email as fallback
    }
    
    toast.success('密码重置说明已发送到您的邮箱');
    return true;
  } catch (error: any) {
    handleAuthError(error, '发送密码重置邮件');
    return false;
  }
};

export const verifyAdminRole = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    // Check for admin role in app_metadata
    const isAdmin = user.app_metadata?.role === 'admin';
    
    if (!isAdmin) {
      // Double-check with admin-provisioning function
      const { data, error } = await supabase.functions.invoke('admin-provisioning', {
        body: {
          action: 'verify_admin',
        }
      });
      
      if (error) {
        console.error('Error verifying admin status:', error);
        return false;
      }
      
      return data?.is_admin || false;
    }
    
    return isAdmin;
  } catch (error) {
    console.error('Error verifying admin status:', error);
    return false;
  }
};

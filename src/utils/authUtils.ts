
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { fetchUserProfile, sendVerificationEmail, handleAuthError } from '@/utils/authHelpers';

export const signInUser = async (email: string, password: string) => {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    toast.success('登录成功！');
    return true;
  } catch (error: any) {
    handleAuthError(error, '登录');
    return false;
  }
};

export const signUpUser = async (email: string, password: string, userData?: any) => {
  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
    
    // Send custom verification email
    try {
      await supabase.functions.invoke('send-notification', {
        body: {
          type: 'email_verification',
          recipient: email,
          data: {
            verificationUrl: `${window.location.origin}/auth/verify`
          }
        }
      });
    } catch (notifError) {
      console.error('Error sending custom verification email:', notifError);
      // Continue as Supabase will send its default email
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
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) throw error;
    
    // Send custom password reset email
    try {
      await supabase.functions.invoke('send-notification', {
        body: {
          type: 'password_reset',
          recipient: email,
          data: {
            resetUrl: `${window.location.origin}/reset-password`
          }
        }
      });
    } catch (invokeError) {
      console.error('发送自定义密码重置邮件时出错:', invokeError);
      // Continue as Supabase will send its default email
    }
    
    toast.success('密码重置说明已发送到您的邮箱');
    return true;
  } catch (error: any) {
    handleAuthError(error, '发送密码重置邮件');
    return false;
  }
};

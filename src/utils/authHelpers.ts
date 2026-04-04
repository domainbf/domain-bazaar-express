
import { toast } from 'sonner';
import { translateAuthError } from '@/utils/translateError';
import { apiGet } from '@/lib/apiClient';

export const fetchUserProfile = async (userId: string) => {
  try {
    const data = await apiGet<any>(`/data/profiles/${userId}`);
    return data?.profile ?? null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const createDefaultProfile = async (_userId: string, _email?: string) => {
  // Profiles are created automatically during registration
  return null;
};

export const sendVerificationEmail = async (_email: string, _verificationUrl: string, _fullName?: string) => {
  // Email verification is handled server-side
  return true;
};

export const handleAuthError = (error: any, action: string) => {
  console.error(`Error during ${action}:`, error);
  const raw = error.message || '';
  const errorMessage = translateAuthError(raw, `${action}失败`);
  toast.error(errorMessage);
  throw new Error(errorMessage);
};

export const cleanupAuthState = () => {
  try {
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

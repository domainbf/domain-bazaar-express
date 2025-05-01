
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const signInWithEmailPassword = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(error.message || 'Failed to log in');
  }
};

export const signUpWithEmailPassword = async (
  email: string, 
  password: string, 
  options?: {
    metadata?: { [key: string]: any };
    redirectTo?: string;
  }
) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: options?.metadata,
        emailRedirectTo: options?.redirectTo,
      }
    });
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Signup error:', error);
    throw new Error(error.message || 'Failed to sign up');
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Logout error:', error);
    toast.error(error.message || 'Failed to log out');
    return { success: false, error };
  }
};

export const resetUserPassword = async (email: string) => {
  try {
    // Use window.location.origin to get the current domain
    const resetPasswordURL = `${window.location.origin}/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetPasswordURL,
    });
    
    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    console.error('Reset password error:', error);
    throw new Error(error.message || 'Failed to send reset password email');
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

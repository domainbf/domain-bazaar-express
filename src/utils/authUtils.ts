
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const signInWithEmailPassword = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      // If the error is about email not being confirmed, enhance the error
      if (error.message.includes('Email not confirmed')) {
        const enhancedError = new Error('Email not confirmed');
        (enhancedError as any).email = email;
        throw enhancedError;
      }
      throw error;
    }
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Login error:', error);
    throw error;
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
    // Set the redirect URL to include the verification success page
    const redirectTo = options?.redirectTo || `${window.location.origin}/login`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: options?.metadata,
        emailRedirectTo: redirectTo,
      }
    });
    
    if (error) throw error;
    
    // Check if user is new or already exists with unconfirmed email
    if (data?.user && !data.user.email_confirmed_at) {
      // Attempt to send a custom welcome email with verification link
      try {
        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'email_verification',
            recipient: email,
            data: {
              verificationUrl: `${window.location.origin}/auth/verify?token=${data.user.confirmation_token}`,
              name: options?.metadata?.full_name || email.split('@')[0]
            }
          }
        });
      } catch (emailError) {
        console.error('Error sending custom verification email:', emailError);
        // Continue even if custom email fails, Supabase will still send its default
      }
    }
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Signup error:', error);
    throw error;
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

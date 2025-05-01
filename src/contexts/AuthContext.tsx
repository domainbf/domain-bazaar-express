
import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '@/types/userProfile';
import { toast } from 'sonner';
import { signInWithEmailPassword, signUpWithEmailPassword, signOut as authSignOut, resetUserPassword } from '@/utils/authUtils';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, metadata?: { [key: string]: any }) => Promise<boolean>;
  logOut: () => Promise<void>;
  signOut: () => Promise<void>; // Added missing property
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  isAdmin: boolean;
  checkAdminStatus: () => Promise<boolean>; // Added missing property
  refreshProfile: () => Promise<void>; // Added missing property
  resetPassword: (email: string) => Promise<boolean>;
  isAuthenticating?: boolean; // Added missing property
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const setData = async (session: Session | null) => {
      if (session?.user) {
        setUser(session.user);
        
        // Check if admin role exists in metadata
        const isAdminUser = session.user.app_metadata?.is_admin || false;
        setIsAdmin(isAdminUser);
        
        // Fetch user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        setProfile(profileData);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setIsLoading(true);
        await setData(session);
        setIsLoading(false);
      }
    );

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await setData(session);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      setProfile(data);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const checkAdminStatus = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Check if user has admin role in app_metadata
      const isAdminUser = user.app_metadata?.is_admin || false;
      
      // Double-check with a direct session fetch to ensure we have latest metadata
      const { data: { session } } = await supabase.auth.getSession();
      const currentIsAdmin = session?.user?.app_metadata?.is_admin || false;
      
      setIsAdmin(currentIsAdmin);
      return currentIsAdmin;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsAuthenticating(true);
      const { success, data } = await signInWithEmailPassword(email, password);
      if (success && data.user) {
        // Fetch profile after login
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        setProfile(profileData);
        
        // Check if admin
        const isAdminUser = data.user.app_metadata?.is_admin || false;
        setIsAdmin(isAdminUser);
        
        return true;
      } else {
        return false;
      }
    } catch (error: any) {
      toast.error(error.message || '登录失败');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signUp = async (email: string, password: string, metadata?: { [key: string]: any }) => {
    try {
      setIsAuthenticating(true);
      const { success } = await signUpWithEmailPassword(email, password, { 
        metadata,
        redirectTo: `${window.location.origin}/login` 
      });
      
      if (success) {
        toast.success('注册成功，请验证您的邮箱');
        return true;
      }
      return false;
    } catch (error: any) {
      toast.error(error.message || '注册失败');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logOut = async () => {
    try {
      const { success } = await authSignOut();
      if (success) {
        setUser(null);
        setSession(null);
        setProfile(null);
        setIsAdmin(false);
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message || '退出失败');
    }
  };

  // Add signOut as an alias to logOut for consistency
  const signOut = logOut;

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return false;
    
    try {
      // Create a new object with only the properties that exist in the profiles table
      const profileData: Record<string, any> = {};
      
      // Copy only valid properties from data to profileData
      if ('full_name' in data) profileData.full_name = data.full_name;
      if ('username' in data) profileData.username = data.username;
      if ('bio' in data) profileData.bio = data.bio;
      if ('contact_email' in data) profileData.contact_email = data.contact_email;
      if ('contact_phone' in data) profileData.contact_phone = data.contact_phone;
      if ('company_name' in data) profileData.company_name = data.company_name;
      if ('custom_url' in data) profileData.custom_url = data.custom_url;
      if ('avatar_url' in data) profileData.avatar_url = data.avatar_url;
      
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update local profile state
      setProfile((prev) => prev ? { ...prev, ...profileData } : null);
      
      toast.success('个人资料更新成功');
      return true;
    } catch (error: any) {
      toast.error(error.message || '更新个人资料失败');
      return false;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setIsAuthenticating(true);
      const { success } = await resetUserPassword(email);
      if (success) {
        toast.success('重置密码链接已发送到您的邮箱');
        return true;
      }
      return false;
    } catch (error: any) {
      toast.error(error.message || '发送重置密码邮件失败');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const contextValue = {
    user,
    session,
    profile,
    isLoading,
    signIn,
    signUp,
    logOut,
    signOut,  // Added alias
    updateProfile,
    isAdmin,
    resetPassword,
    checkAdminStatus, // Added missing function
    refreshProfile,   // Added missing function
    isAuthenticating  // Added missing property
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '@/types/userProfile';
import { toast } from 'sonner';
import { signInWithEmailPassword, signUpWithEmailPassword, signOut, resetUserPassword } from '@/utils/authUtils';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, metadata?: { [key: string]: any }) => Promise<boolean>;
  logOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  isAdmin: boolean;
  resetPassword: (email: string) => Promise<boolean>;
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

  const signIn = async (email: string, password: string) => {
    try {
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
    }
  };

  const signUp = async (email: string, password: string, metadata?: { [key: string]: any }) => {
    try {
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
    }
  };

  const logOut = async () => {
    try {
      const { success } = await signOut();
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

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update local profile state
      setProfile((prev) => prev ? { ...prev, ...data } : null);
      
      toast.success('个人资料更新成功');
      return true;
    } catch (error: any) {
      toast.error(error.message || '更新个人资料失败');
      return false;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { success } = await resetUserPassword(email);
      if (success) {
        toast.success('重置密码链接已发送到您的邮箱');
        return true;
      }
      return false;
    } catch (error: any) {
      toast.error(error.message || '发送重置密码邮件失败');
      return false;
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
    updateProfile,
    isAdmin,
    resetPassword
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

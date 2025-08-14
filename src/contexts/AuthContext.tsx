
import { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
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
  signOut: () => Promise<void>; 
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  isAdmin: boolean;
  checkAdminStatus: () => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  isAuthenticating?: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  const createDefaultProfile = useCallback(async (userId: string, email?: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: email?.split('@')[0] || 'User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error creating default profile:', error);
      } else {
        const { data: newProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (newProfile) {
          setProfile(newProfile);
        }
      }
    } catch (error) {
      console.error('Error in createDefaultProfile:', error);
    }
  }, []);

  // 优化认证状态处理
  const setData = useCallback(async (session: Session | null) => {
    try {
      if (session?.user) {
        setUser(session.user);
        setSession(session);
        
        // 快速设置管理员状态
        const isAdminUser = Boolean(session.user.app_metadata?.is_admin) || 
                           Boolean(session.user.user_metadata?.is_admin) ||
                           session.user.email === '9208522@qq.com';
        setIsAdmin(isAdminUser);
        
        // 异步加载用户资料，不阻塞主流程
        setTimeout(async () => {
          try {
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
            
            if (!error && profileData) {
              setProfile(profileData);
            } else if (error && error.code === 'PGRST116') {
              await createDefaultProfile(session.user.id, session.user.email);
            }
          } catch (profileError) {
            console.error('Error fetching profile:', profileError);
          }
        }, 0);
      } else {
        setUser(null);
        setSession(null);
        setProfile(null);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error in setData:', error);
    } finally {
      setIsLoading(false);
    }
  }, [createDefaultProfile]);

  useEffect(() => {
    let mounted = true;
    let sessionCheckTimer: NodeJS.Timeout;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await setData(session);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setProfile(null);
          setIsAdmin(false);
          setIsLoading(false);
        } else {
          await setData(session);
        }
      }
    );

    const getInitialSession = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 3000)
        );

        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (error) {
          console.error('Error getting session:', error);
          setIsLoading(false);
          return;
        }
        
        if (mounted) {
          await setData(session);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    sessionCheckTimer = setTimeout(getInitialSession, 50);

    return () => {
      mounted = false;
      if (sessionCheckTimer) clearTimeout(sessionCheckTimer);
      subscription.unsubscribe();
    };
  }, [setData]);

  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
        
      if (!error && data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const checkAdminStatus = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) return false;
      
      // 检查用户的 raw_app_meta_data 中的 is_admin 字段
      const currentIsAdmin = Boolean(session?.user?.app_metadata?.is_admin) || 
                           Boolean(session?.user?.user_metadata?.is_admin) ||
                           session?.user?.email === '9208522@qq.com';
      
      console.log('Admin check for user:', session?.user?.email, 'isAdmin:', currentIsAdmin);
      console.log('App metadata:', session?.user?.app_metadata);
      
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
      
      const result = await signInWithEmailPassword(email, password);
      
      if (result.success && result.data?.session) {
        await setData(result.data.session);
        toast.success('登录成功');
        return true;
      } else {
        const errorMsg = result.error?.message || '登录失败';
        toast.error(errorMsg);
        return false;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || '登录失败');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signUp = async (email: string, password: string, metadata?: { [key: string]: any }) => {
    try {
      setIsAuthenticating(true);
      
      const result = await signUpWithEmailPassword(email, password, { 
        metadata,
        redirectTo: `https://nic.bn/`
      });
      
      if (result.success) {
        toast.success('注册成功，请验证您的邮箱');
        return true;
      } else {
        const errorMsg = result.error?.message || '注册失败';
        toast.error(errorMsg);
        return false;
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || '注册失败');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logOut = async () => {
    try {
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsAdmin(false);
      
      const result = await authSignOut();
      
      if (result.success) {
        toast.success('退出成功');
        window.location.replace('https://nic.bn/');
      } else {
        console.error('Logout failed:', result.error);
        window.location.replace('https://nic.bn/');
      }
    } catch (error: any) {
      console.error('Logout error:', error);
      window.location.replace('https://nic.bn/');
    }
  };

  const signOut = logOut;

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return false;
    
    try {
      const profileData: Record<string, any> = {
        updated_at: new Date().toISOString()
      };
      
      const validFields = [
        'full_name', 'username', 'bio', 'contact_email', 'contact_phone',
        'company_name', 'custom_url', 'avatar_url'
      ];
      
      validFields.forEach(field => {
        if (field in data && data[field as keyof UserProfile] !== undefined) {
          profileData[field] = data[field as keyof UserProfile];
        }
      });
      
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);
      
      if (error) {
        console.error('Profile update error:', error);
        throw error;
      }
      
      setProfile((prev) => prev ? { ...prev, ...profileData } : null);
      
      toast.success('个人资料更新成功');
      return true;
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.message || '更新个人资料失败');
      return false;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setIsAuthenticating(true);

      const result = await resetUserPassword(email);

      if (result.success) {
        toast.success('重置密码链接已发送到您的邮箱');
        return true;
      } else {
        const errorMsg = '发送重置密码邮件失败';
        toast.error(errorMsg);
        return false;
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
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
    signOut,
    updateProfile,
    isAdmin,
    resetPassword,
    checkAdminStatus,
    refreshProfile,
    isAuthenticating
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

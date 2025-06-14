
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
  signOut: () => Promise<void>; 
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  isAdmin: boolean;
  checkAdminStatus: () => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  isAuthenticating?: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const navigate = useNavigate();
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    const setData = async (session: Session | null) => {
      if (!mounted) return;
      
      try {
        if (session?.user) {
          setUser(session.user);
          setSession(session);
          
          // 检查管理员状态
          const isAdminUser = session.user.app_metadata?.is_admin || false;
          setIsAdmin(isAdminUser);
          
          // 获取用户资料，使用超时和错误处理
          try {
            const { data: profileData, error } = await Promise.race([
              supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
              )
            ]) as any;
            
            if (!error && profileData && mounted) {
              setProfile(profileData);
            }
          } catch (profileError) {
            console.error('Error fetching profile:', profileError);
            // 继续执行，不阻塞认证流程
          }
        } else {
          setUser(null);
          setSession(null);
          setProfile(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error in setData:', error);
      }
    };

    // 设置认证状态监听器
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state change:', event, !!session);
        setIsLoading(true);
        
        try {
          await setData(session);
        } catch (error) {
          console.error('Error handling auth state change:', error);
        } finally {
          if (mounted) {
            setIsLoading(false);
          }
        }
      }
    );

    // 检查现有会话
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          return;
        }
        
        if (mounted) {
          await setData(session);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
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
      // 检查用户是否具有管理员角色
      const isAdminUser = user.app_metadata?.is_admin || false;
      
      // 双重检查以确保我们有最新的元数据
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
      
      // 清理现有认证状态
      try {
        await supabase.auth.signOut();
      } catch {
        // 忽略退出错误
      }
      
      const { success, data, error } = await signInWithEmailPassword(email, password);
      
      if (success && data.user) {
        // 等待认证状态更新
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 获取用户资料
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          
          if (profileData) {
            setProfile(profileData);
          }
        } catch (profileError) {
          console.error('Error fetching profile after login:', profileError);
        }
        
        // 检查管理员状态
        const isAdminUser = data.user.app_metadata?.is_admin || false;
        setIsAdmin(isAdminUser);
        
        toast.success('登录成功');
        return true;
      } else {
        toast.error(error?.message || '登录失败');
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
      const { success, error } = await signUpWithEmailPassword(email, password, { 
        metadata,
        redirectTo: `${window.location.origin}/`
      });
      
      if (success) {
        toast.success('注册成功，请验证您的邮箱');
        return true;
      } else {
        toast.error(error?.message || '注册失败');
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
      // 清理本地状态
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsAdmin(false);
      
      // 执行退出
      const { success } = await authSignOut();
      
      if (success) {
        toast.success('退出成功');
        // 强制页面刷新以清理所有状态
        window.location.href = '/';
      } else {
        toast.error('退出失败');
      }
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error(error.message || '退出失败');
      // 即使退出失败也清理本地状态
      window.location.href = '/';
    }
  };

  // 添加 signOut 作为 logOut 的别名
  const signOut = logOut;

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return false;
    
    try {
      // 创建一个新对象，只包含存在于 profiles 表中的属性
      const profileData: Record<string, any> = {};
      
      // 复制有效属性
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
      
      // 更新本地资料状态
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
      const { success, error } = await resetUserPassword(email);
      if (success) {
        toast.success('重置密码链接已发送到您的邮箱');
        return true;
      } else {
        toast.error(error?.message || '发送重置密码邮件失败');
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

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData?: any) => Promise<void>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          fetchProfile(session.user.id);
          
          if (event === 'PASSWORD_RECOVERY') {
            toast.success('密码已成功更新！');
          }
          
          if (event === 'SIGNED_UP' || event === 'SIGNED_IN') {
            try {
              await supabase.functions.invoke('send-notification', {
                body: {
                  type: 'email_verification',
                  recipient: session.user.email,
                  data: {
                    verificationUrl: `${window.location.origin}/auth/verify`
                  }
                }
              });
              
              if (event === 'SIGNED_UP') {
                toast.success('注册成功！请查看邮箱完成验证。');
              } else {
                toast.success('登录成功！');
              }
            } catch (error) {
              console.error('发送验证邮件时出错:', error);
            }
          }
        } else {
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('获取用户资料时出错:', error);
      // Don't show error toast here, as the profile might not exist yet
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    setIsLoading(true);
    await fetchProfile(user.id);
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast.success('登录成功！');
    } catch (error: any) {
      toast.error(error.message || '登录时出错');
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData?: any) => {
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
      toast.success('注册成功！请检查您的邮箱以完成验证。');
    } catch (error: any) {
      toast.error(error.message || '注册时出错');
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('已成功退出登录');
    } catch (error: any) {
      toast.error(error.message || '退出登录时出错');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
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
    } catch (error: any) {
      toast.error(error.message || '发送密码重置邮件时出错');
      throw error;
    }
  };

  const value = {
    session,
    user,
    profile,
    isLoading,
    signIn,
    signUp,
    signOut: handleSignOut,
    logout: handleSignOut,
    refreshProfile,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

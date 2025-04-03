
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { fetchUserProfile, sendVerificationEmail } from '@/utils/authHelpers';
import { signInUser, signUpUser, signOutUser, resetUserPassword } from '@/utils/authUtils';

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
    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          fetchAndSetProfile(session.user.id);
          
          if (event === 'PASSWORD_RECOVERY') {
            toast.success('密码已成功更新！');
          }
          
          if (event === 'SIGNED_UP' || event === 'SIGNED_IN') {
            try {
              console.log('Sending verification email for event:', event);
              await sendVerificationEmail(
                session.user.email!, 
                `${window.location.origin}/auth/verify`
              );
              
              if (event === 'SIGNED_UP') {
                toast.success('注册成功！请查看邮箱完成验证。');
              } else if (event === 'SIGNED_IN') {
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

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAndSetProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchAndSetProfile = async (userId: string) => {
    const profileData = await fetchUserProfile(userId);
    setProfile(profileData);
    setIsLoading(false);
  };

  const refreshProfile = async () => {
    if (!user) return;
    setIsLoading(true);
    await fetchAndSetProfile(user.id);
  };

  const signIn = async (email: string, password: string) => {
    await signInUser(email, password);
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    await signUpUser(email, password, userData);
  };

  const handleSignOut = async () => {
    await signOutUser();
  };

  const resetPassword = async (email: string) => {
    await resetUserPassword(email);
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


import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/userProfile';
import { toast } from 'sonner';
import { signInUser, signUpUser, signOutUser, resetUserPassword } from '@/utils/authUtils';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, userData?: any) => Promise<boolean>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        throw error;
      }
      
      setProfile(data);
      
      // Check if user has admin role (based on email for this demo)
      setIsAdmin(user.email === '9208522@qq.com');
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load user profile');
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          await refreshProfile();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        toast.error('Authentication error');
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await refreshProfile();
        } else {
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const signIn = async (email: string, password: string) => {
    return signInUser(email, password);
  };
  
  const signUp = async (email: string, password: string, userData?: any) => {
    return signUpUser(email, password, userData);
  };
  
  const signOut = async () => {
    try {
      await signOutUser();
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };
  
  const resetPassword = async (email: string) => {
    return resetUserPassword(email);
  };
  
  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        profile, 
        isAdmin, 
        isLoading, 
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

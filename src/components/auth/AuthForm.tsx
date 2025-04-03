
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Lock, User } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";

interface AuthFormProps {
  mode: 'signin' | 'signup';
  onChangeMode: (mode: 'signin' | 'signup') => void;
  onForgotPassword: () => void;
  onSuccess?: () => void;
}

export const AuthForm = ({ 
  mode, 
  onChangeMode, 
  onForgotPassword,
  onSuccess 
}: AuthFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { signIn, signUp } = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (mode === 'signup') {
        console.log('Attempting to sign up with email:', email);
        await signUp(email, password, {
          full_name: fullName
        });
        // Don't close modal on signup to show confirmation message
      } else {
        console.log('Attempting to sign in with email:', email);
        await signIn(email, password);
        if (onSuccess) onSuccess();
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      setErrorMessage(error.message || 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleAuth} className="space-y-4 mt-4">
      {errorMessage && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
          {errorMessage}
        </div>
      )}
      
      {mode === 'signup' && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <User className="w-4 h-4" /> Full Name
          </label>
          <Input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="bg-white border-gray-300 focus:border-black transition-colors"
            placeholder="John Doe"
          />
        </div>
      )}
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Mail className="w-4 h-4" /> Email
        </label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-white border-gray-300 focus:border-black transition-colors"
          placeholder="you@example.com"
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Lock className="w-4 h-4" /> Password
        </label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="bg-white border-gray-300 focus:border-black transition-colors"
          minLength={6}
          placeholder={mode === 'signup' ? "Minimum 6 characters" : "Your password"}
        />
      </div>
      
      {mode === 'signin' && (
        <div className="text-right">
          <button 
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-black hover:underline"
          >
            Forgot password?
          </button>
        </div>
      )}
      
      <Button 
        type="submit"
        disabled={isLoading}
        className="w-full bg-black text-white hover:bg-gray-800 transition-colors"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="animate-spin w-4 h-4" />
            {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
          </span>
        ) : (
          mode === 'signin' ? 'Sign In' : 'Sign Up'
        )}
      </Button>
      
      {mode === 'signin' ? (
        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <button 
            type="button"
            onClick={() => onChangeMode('signup')}
            className="text-black font-medium hover:underline"
          >
            Sign up
          </button>
        </p>
      ) : (
        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <button 
            type="button"
            onClick={() => onChangeMode('signin')}
            className="text-black font-medium hover:underline"
          >
            Sign in
          </button>
        </p>
      )}
    </form>
  );
};

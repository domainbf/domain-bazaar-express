
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";

interface AuthModalProps {
  open: boolean;
  isOpen?: boolean; // For backward compatibility
  onClose: () => void;
  mode?: 'signin' | 'signup';
  onChangeMode?: (mode: 'signin' | 'signup') => void;
}

export const AuthModal = ({ open, isOpen, onClose, mode = 'signin', onChangeMode }: AuthModalProps) => {
  const [activeMode, setActiveMode] = useState<'signin' | 'signup'>(mode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();
  
  // Use either open or isOpen (for backward compatibility)
  const isModalOpen = open || isOpen;

  // Clear form on open/close or mode change
  useEffect(() => {
    setEmail('');
    setPassword('');
    setFullName('');
    setErrorMessage('');
    setShowResetPassword(false);
    setActiveMode(mode);
  }, [isModalOpen, mode]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (activeMode === 'signup') {
        await signUp(email, password, {
          full_name: fullName
        });
      } else {
        await signIn(email, password);
      }
      
      onClose();
    } catch (error: any) {
      console.error('Authentication error:', error);
      setErrorMessage(error.message || 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      await resetPassword(email);
      setShowResetPassword(false);
      toast.success('Password reset instructions sent to your email');
    } catch (error: any) {
      console.error('Password reset error:', error);
      setErrorMessage(error.message || 'Error sending password reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = (newMode: 'signin' | 'signup') => {
    setActiveMode(newMode);
    if (onChangeMode) onChangeMode(newMode);
  };

  const renderResetPasswordForm = () => (
    <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
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
      
      <Button 
        type="submit"
        disabled={isLoading || !email}
        className="w-full bg-black text-white hover:bg-gray-800 transition-colors"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="animate-spin w-4 h-4" />
            Sending...
          </span>
        ) : (
          "Send Reset Instructions"
        )}
      </Button>
      
      <p className="text-center text-sm text-gray-600">
        <button 
          type="button"
          onClick={() => setShowResetPassword(false)}
          className="text-black font-medium hover:underline"
        >
          Back to login
        </button>
      </p>
    </form>
  );

  const renderAuthForm = () => (
    <form onSubmit={handleAuth} className="space-y-4 mt-4">
      {activeMode === 'signup' && (
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
          placeholder={activeMode === 'signup' ? "Minimum 6 characters" : "Your password"}
        />
      </div>
      
      {activeMode === 'signin' && (
        <div className="text-right">
          <button 
            type="button"
            onClick={() => setShowResetPassword(true)}
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
            {activeMode === 'signin' ? 'Signing in...' : 'Creating account...'}
          </span>
        ) : (
          activeMode === 'signin' ? 'Sign In' : 'Sign Up'
        )}
      </Button>
      
      {activeMode === 'signin' ? (
        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <button 
            type="button"
            onClick={() => handleModeChange('signup')}
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
            onClick={() => handleModeChange('signin')}
            className="text-black font-medium hover:underline"
          >
            Sign in
          </button>
        </p>
      )}
    </form>
  );

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-gray-200 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-black">
            {showResetPassword ? 'Reset Password' : (activeMode === 'signin' ? 'Sign In' : 'Create an Account')}
          </DialogTitle>
        </DialogHeader>
        
        {errorMessage && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
            {errorMessage}
          </div>
        )}
        
        {showResetPassword ? renderResetPasswordForm() : renderAuthForm()}
      </DialogContent>
    </Dialog>
  );
};

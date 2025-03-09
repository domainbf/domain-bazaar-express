
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'signin' | 'signup';
}

export const AuthModal = ({ isOpen, onClose, mode }: AuthModalProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Clear form on open/close or mode change
  useEffect(() => {
    setEmail('');
    setPassword('');
    setFullName('');
    setErrorMessage('');
  }, [isOpen, mode]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        });

        if (error) throw error;
        toast.success('Account created successfully! Please check your email for verification.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        toast.success('Signed in successfully!');
      }
      
      onClose();
    } catch (error: any) {
      console.error('Authentication error:', error);
      setErrorMessage(error.message || 'An error occurred during authentication');
      toast.error(error.message || 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-gray-200 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-black">
            {mode === 'signin' ? 'Sign In' : 'Create an Account'}
          </DialogTitle>
        </DialogHeader>
        
        {errorMessage && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
            {errorMessage}
          </div>
        )}
        
        <form onSubmit={handleAuth} className="space-y-4 mt-4">
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
                onClick={() => {
                  onClose();
                  // Need to implement a way to switch to signup mode
                  // This would need coordination with the parent component
                }}
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
                onClick={() => {
                  onClose();
                  // Need to implement a way to switch to signin mode
                  // This would need coordination with the parent component
                }}
                className="text-black font-medium hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

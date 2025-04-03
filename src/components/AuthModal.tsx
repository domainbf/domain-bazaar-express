
import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { AuthForm } from "./auth/AuthForm";
import { ResetPasswordRequestForm } from "./auth/ResetPasswordRequestForm";
import { AuthModalHeader } from './auth/AuthModalHeader';

interface AuthModalProps {
  open: boolean;
  isOpen?: boolean; // For backward compatibility
  onClose: () => void;
  mode?: 'signin' | 'signup';
  onChangeMode?: (mode: 'signin' | 'signup') => void;
}

export const AuthModal = ({ 
  open, 
  isOpen, 
  onClose, 
  mode = 'signin', 
  onChangeMode 
}: AuthModalProps) => {
  const [activeMode, setActiveMode] = useState<'signin' | 'signup'>(mode);
  const [showResetPassword, setShowResetPassword] = useState(false);
  
  // Use either open or isOpen (for backward compatibility)
  const isModalOpen = open || isOpen;

  // Clear form on open/close or mode change
  useEffect(() => {
    setShowResetPassword(false);
    setActiveMode(mode);
  }, [isModalOpen, mode]);

  const handleModeChange = (newMode: 'signin' | 'signup') => {
    setActiveMode(newMode);
    if (onChangeMode) onChangeMode(newMode);
  };

  const handlePasswordResetSuccess = () => {
    setShowResetPassword(false);
    toast.success('Password reset instructions sent to your email');
  };

  // Determine the title based on current state
  const getTitle = () => {
    if (showResetPassword) return 'Reset Password';
    return activeMode === 'signin' ? 'Sign In' : 'Create an Account';
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-gray-200 max-w-md">
        <AuthModalHeader title={getTitle()} />
        
        {showResetPassword ? (
          <ResetPasswordRequestForm 
            onCancel={() => setShowResetPassword(false)}
            onSuccess={handlePasswordResetSuccess}
          />
        ) : (
          <AuthForm 
            mode={activeMode}
            onChangeMode={handleModeChange}
            onForgotPassword={() => setShowResetPassword(true)}
            onSuccess={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

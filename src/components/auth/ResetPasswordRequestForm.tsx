
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";

interface ResetPasswordRequestFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export const ResetPasswordRequestForm = ({ onCancel, onSuccess }: ResetPasswordRequestFormProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { resetPassword } = useAuth();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      await resetPassword(email);
      onSuccess();
    } catch (error: any) {
      console.error('Password reset error:', error);
      setErrorMessage(error.message || 'Error sending password reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
      {errorMessage && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
          {errorMessage}
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
          onClick={onCancel}
          className="text-black font-medium hover:underline"
        >
          Back to login
        </button>
      </p>
    </form>
  );
};

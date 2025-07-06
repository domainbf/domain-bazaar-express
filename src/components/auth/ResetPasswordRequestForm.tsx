
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail } from 'lucide-react';
import { resetUserPassword } from "@/utils/authUtils";
import { toast } from 'sonner';

interface ResetPasswordRequestFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export const ResetPasswordRequestForm = ({ onCancel, onSuccess }: ResetPasswordRequestFormProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      await resetUserPassword(email);
      toast.success('密码重置邮件已发送，请检查您的邮箱');
      onSuccess();
    } catch (error: any) {
      console.error('密码重置错误:', error);
      setErrorMessage(error.message || '发送密码重置邮件失败');
      toast.error(error.message || '发送密码重置邮件失败');
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
          <Mail className="w-4 h-4" /> 邮箱地址
        </label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-white border-gray-300 focus:border-black transition-colors"
          placeholder="your@email.com"
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
            发送中...
          </span>
        ) : (
          "发送重置邮件"
        )}
      </Button>
      
      <p className="text-center text-sm text-gray-600">
        <button 
          type="button"
          onClick={onCancel}
          className="text-black font-medium hover:underline"
        >
          返回登录
        </button>
      </p>
    </form>
  );
};

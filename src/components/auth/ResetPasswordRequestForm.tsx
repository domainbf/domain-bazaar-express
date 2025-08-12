
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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

    // 基本验证
    if (!email || !email.includes('@')) {
      setErrorMessage('请输入有效的邮箱地址');
      setIsLoading(false);
      return;
    }

    try {
      console.log('开始发送密码重置邮件:', email);
      
      // 使用 Supabase 内置的密码重置功能
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `https://nic.bn/reset-password`,
      });
      
      if (error) {
        console.error('密码重置错误:', error);
        throw error;
      }
      
      toast.success('密码重置邮件已发送，请检查您的邮箱');
      onSuccess();
      
    } catch (error: any) {
      console.error('密码重置请求失败:', error);
      
      let friendlyMessage = '发送密码重置邮件失败';
      
      if (error.message?.includes('Email not confirmed')) {
        friendlyMessage = '请先验证您的邮箱地址';
      } else if (error.message?.includes('User not found')) {
        friendlyMessage = '该邮箱地址未注册';
      } else if (error.message?.includes('rate limit')) {
        friendlyMessage = '请求过于频繁，请稍后重试';
      } else if (error.message) {
        friendlyMessage = error.message;
      }
      
      setErrorMessage(friendlyMessage);
      toast.error(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 p-3 rounded-md flex items-start mb-4">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 text-sm">{errorMessage}</p>
        </div>
      )}
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Mail className="w-4 h-4" /> 邮箱地址
        </label>
        <Input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrorMessage('');
          }}
          required
          className="bg-white border-gray-300 focus:border-black transition-colors"
          placeholder="your@email.com"
          disabled={isLoading}
        />
      </div>
      
      <Button 
        type="submit"
        disabled={isLoading || !email}
        className="w-full bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
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
          className="text-black font-medium hover:underline disabled:opacity-50"
          disabled={isLoading}
        >
          返回登录
        </button>
      </p>
    </form>
  );
};

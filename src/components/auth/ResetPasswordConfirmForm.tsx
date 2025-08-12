
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, EyeIcon, EyeOffIcon, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const ResetPasswordConfirmForm = ({ token }: { token: string }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const validatePassword = () => {
    if (password.length < 6) {
      toast.error('密码至少需要6个字符');
      return false;
    }
    
    if (password !== confirmPassword) {
      toast.error('两次输入的密码不匹配');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) return;
    
    setIsLoading(true);
    
    try {
      // Use the update password API with the token from the URL
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });
      
      if (error) throw error;
      
      setIsSuccess(true);
      toast.success('密码已成功重置');
      // 立即跳转，确保新会话生效
      setTimeout(() => {
        window.location.href = 'https://nic.bn/user-center';
      }, 800);
    } catch (error: any) {
      console.error('重置密码时出错:', error);
      toast.error(error.message || '重置密码失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Card className="w-full shadow-md border border-gray-200">
      <CardHeader className={isSuccess ? "pb-2" : "pb-6"}>
        <CardTitle className="text-2xl font-bold">更新密码</CardTitle>
        <CardDescription>
          {!isSuccess 
            ? "请设置一个安全的新密码" 
            : "您的密码已成功更新"}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">新密码</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="输入您的新密码"
                  className="pr-10"
                  minLength={6}
                  disabled={isLoading}
                />
                <button 
                  type="button"
                  className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                  onClick={toggleShowPassword}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">确认密码</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="再次输入您的新密码"
                  className="pr-10"
                  minLength={6}
                  disabled={isLoading}
                />
              </div>
            </div>
          </form>
        ) : (
          <div className="py-4">
            <div className="bg-green-50 text-green-700 p-4 rounded-md flex items-start">
              <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">您的密码已更新！</p>
                <p className="mt-1">您现在可以使用新密码登录您的账户。</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className={isSuccess ? "justify-center" : "justify-between"}>
        {!isSuccess ? (
          <>
            <Button 
              variant="outline" 
              onClick={() => navigate('/auth')}
              disabled={isLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> 返回登录
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isLoading || !password || !confirmPassword}
              className="bg-black hover:bg-gray-800"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 更新中...
                </>
              ) : (
                "更新密码"
              )}
            </Button>
          </>
        ) : (
          <Button 
            onClick={() => navigate('/auth')}
            className="w-full"
          >
            前往登录
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

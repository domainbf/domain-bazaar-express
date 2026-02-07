import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, EyeIcon, EyeOffIcon, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ResetPasswordConfirmFormProps {
  tokenData: {
    accessToken: string;
    refreshToken: string;
  };
}

export const ResetPasswordConfirmForm = ({ tokenData }: ResetPasswordConfirmFormProps) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const validatePassword = () => {
    if (password.length < 6) {
      setErrorMessage('密码至少需要6个字符');
      return false;
    }
    
    if (password !== confirmPassword) {
      setErrorMessage('两次输入的密码不匹配');
      return false;
    }
    
    setErrorMessage('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) return;
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // 只有在用户提交新密码时，才建立会话并更新密码
      // 这样原密码在用户确认修改之前仍然有效
      console.log('开始设置会话并更新密码...');
      
      // 使用 recovery token 建立会话
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: tokenData.accessToken,
        refresh_token: tokenData.refreshToken,
      });
      
      if (sessionError) {
        console.error('设置会话失败:', sessionError);
        throw new Error('重置链接已过期或无效，请重新请求密码重置');
      }
      
      // 更新密码 - 只有这一步执行后，原密码才会失效
      const { error: updateError } = await supabase.auth.updateUser({ 
        password: password 
      });
      
      if (updateError) {
        console.error('更新密码失败:', updateError);
        throw updateError;
      }
      
      setIsSuccess(true);
      toast.success('密码已成功重置！');
      
      // 延迟跳转，让用户看到成功消息
      setTimeout(() => {
        window.location.href = '/user-center';
      }, 1500);
      
    } catch (error: any) {
      console.error('重置密码时出错:', error);
      
      let friendlyMessage = '重置密码失败，请重试';
      if (error.message?.includes('expired') || error.message?.includes('invalid')) {
        friendlyMessage = '重置链接已过期或无效，请重新请求密码重置';
      } else if (error.message?.includes('Password should be')) {
        friendlyMessage = '密码不符合安全要求，请使用至少6个字符的密码';
      } else if (error.message) {
        friendlyMessage = error.message;
      }
      
      setErrorMessage(friendlyMessage);
      toast.error(friendlyMessage);
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
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="w-6 h-6" />
          设置新密码
        </CardTitle>
        <CardDescription>
          {!isSuccess 
            ? "请设置一个安全的新密码（设置成功后原密码将失效）" 
            : "您的密码已成功更新"}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {errorMessage && !isSuccess && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-md flex items-start mb-4">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 text-sm">{errorMessage}</p>
          </div>
        )}
        
        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-md flex items-start mb-4">
              <AlertCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-blue-700 text-sm">
                在您提交新密码之前，原密码仍然有效。只有确认修改后，原密码才会失效。
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">新密码</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage('');
                  }}
                  required
                  placeholder="输入您的新密码（至少6个字符）"
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
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrorMessage('');
                  }}
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
                <p className="mt-1">正在跳转到用户中心...</p>
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
                "确认修改密码"
              )}
            </Button>
          </>
        ) : (
          <Button 
            onClick={() => navigate('/user-center')}
            className="w-full"
          >
            前往用户中心
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};


import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const ResetPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log('尝试重置密码，邮箱:', email);
      await resetPassword(email);
      setIsSubmitted(true);
      toast.success('密码重置链接已发送到您的邮箱');
    } catch (error: any) {
      console.error('重置密码请求出错:', error);
      toast.error(error.message || '发送重置邮件时出错');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-md border border-gray-200">
      <CardHeader className={isSubmitted ? "pb-2" : "pb-6"}>
        <CardTitle className="text-2xl font-bold">重置密码</CardTitle>
        <CardDescription>
          {!isSubmitted 
            ? "输入您的邮箱，我们将发送重置密码的说明" 
            : "请查看您的邮箱获取重置指引"}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail className="w-4 h-4" /> 邮箱
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full"
                disabled={isLoading}
              />
            </div>
          </form>
        ) : (
          <div className="py-4">
            <div className="bg-green-50 text-green-700 p-4 rounded-md mb-4 flex items-start">
              <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">密码重置指引已发送至:</p>
                <p className="mt-1">{email}</p>
              </div>
            </div>
            <div className="bg-blue-50 text-blue-700 p-4 rounded-md mt-4 flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">注意事项</p>
                <ul className="mt-1 text-sm space-y-1 list-disc list-inside ml-1">
                  <li>重置链接有效期为30分钟</li>
                  <li>如果没有看到邮件，请检查垃圾邮件文件夹</li>
                  <li>确保使用您注册时的邮箱地址</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className={isSubmitted ? "justify-center" : "justify-between"}>
        {!isSubmitted ? (
          <>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/auth')}
              disabled={isLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> 返回登录
            </Button>
            <Button 
              type="submit" 
              onClick={handleSubmit}
              disabled={isLoading || !email}
              className="bg-black hover:bg-gray-800"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 发送中...
                </>
              ) : (
                "重置密码"
              )}
            </Button>
          </>
        ) : (
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/auth')}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> 返回登录
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

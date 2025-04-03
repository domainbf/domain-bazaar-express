
import { Navbar } from '@/components/Navbar';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export const ResetPassword = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-12 flex justify-center">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-6">重置密码</h1>
          <p className="text-gray-600 text-center mb-8">
            请输入您注册时使用的邮箱，我们将发送重置链接给您
          </p>
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
};

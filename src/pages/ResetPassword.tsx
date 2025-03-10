
import { Navbar } from '@/components/Navbar';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export const ResetPassword = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-12 flex justify-center">
        <ResetPasswordForm />
      </div>
    </div>
  );
};

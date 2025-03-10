
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
      await resetPassword(email);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error requesting password reset:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
        <CardDescription>
          {!isSubmitted 
            ? "Enter your email and we'll send you instructions to reset your password" 
            : "Check your inbox for instructions"}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full"
                disabled={isLoading}
              />
            </div>
          </form>
        ) : (
          <div className="py-4 text-center">
            <div className="bg-green-50 text-green-700 p-4 rounded-md mb-4">
              <p>Password reset instructions have been sent to:</p>
              <p className="font-medium mt-2">{email}</p>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Please check your email inbox and follow the instructions to reset your password.
              If you don't see the email, check your spam folder.
            </p>
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
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
            </Button>
            <Button 
              type="submit" 
              onClick={handleSubmit}
              disabled={isLoading || !email}
              className="bg-black hover:bg-gray-800"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </>
        ) : (
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/auth')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

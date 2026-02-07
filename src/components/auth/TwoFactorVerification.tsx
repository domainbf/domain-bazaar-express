import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Loader2, AlertCircle, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface TwoFactorVerificationProps {
  factorId: string;
  onSuccess: () => void;
  onCancel: () => void;
  onUseRecoveryCode: () => void;
}

export const TwoFactorVerification = ({ 
  factorId, 
  onSuccess, 
  onCancel,
  onUseRecoveryCode 
}: TwoFactorVerificationProps) => {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('请输入6位验证码');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const { data, error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code
      });

      if (verifyError) throw verifyError;

      toast.success('验证成功！');
      onSuccess();
    } catch (error: any) {
      console.error('2FA verification error:', error);
      setError('验证码错误，请重试');
      setCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length === 6) {
      handleVerify();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>两步验证</CardTitle>
        <CardDescription>
          请输入身份验证器应用中显示的验证码
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center" onKeyPress={handleKeyPress}>
          <InputOTP 
            maxLength={6} 
            value={code}
            onChange={setCode}
            autoFocus
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleVerify} 
            disabled={code.length !== 6 || isVerifying}
            className="w-full"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                验证中...
              </>
            ) : (
              '验证'
            )}
          </Button>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="flex-1"
            >
              取消
            </Button>
            <Button 
              variant="ghost" 
              onClick={onUseRecoveryCode}
              className="flex-1"
            >
              <Key className="w-4 h-4 mr-2" />
              使用恢复码
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          打开您的身份验证器应用（如 Google Authenticator），输入显示的6位数字验证码
        </p>
      </CardContent>
    </Card>
  );
};

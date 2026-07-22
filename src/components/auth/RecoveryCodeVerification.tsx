import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface RecoveryCodeVerificationProps {
  onSuccess: () => void;
  onBack: () => void;
}

export const RecoveryCodeVerification = ({ 
  onSuccess, 
  onBack 
}: RecoveryCodeVerificationProps) => {
  const [recoveryCode, setRecoveryCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!recoveryCode.trim()) {
      setError('请输入恢复码');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      // 恢复码功能尚未在后端启用。为避免绕过 MFA，此处默认失败关闭。
      // 请使用验证器 App 生成的 6 位 TOTP 验证码完成登录，或联系客服重置 MFA。
      await new Promise((resolve) => setTimeout(resolve, 400));
      throw new Error('recovery_disabled');
    } catch (error: any) {
      console.error('Recovery code verification error:', error);
      setError('恢复码验证暂未开放，请使用验证器 App 中的 6 位验证码，或联系客服协助重置 MFA。');
      setRecoveryCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Key className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>使用恢复码</CardTitle>
        <CardDescription>
          输入您保存的恢复码之一来验证身份
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="recovery-code">恢复码</Label>
          <Input
            id="recovery-code"
            type="text"
            value={recoveryCode}
            onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            placeholder="XXXX-XXXX-XXXX"
            autoComplete="one-time-code"
            className="font-mono text-center text-lg tracking-wider"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            格式示例：ABC123-DEF456
          </p>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleVerify} 
            disabled={!recoveryCode.trim() || isVerifying}
            className="w-full"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                验证中...
              </>
            ) : (
              '验证恢复码'
            )}
          </Button>

          <Button 
            variant="outline" 
            onClick={onBack}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回使用验证码
          </Button>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            每个恢复码只能使用一次。使用后请妥善保管剩余的恢复码。
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

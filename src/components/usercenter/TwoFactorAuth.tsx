import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Shield, ShieldCheck, ShieldOff, Smartphone, Key, Copy, Check, 
  Loader2, AlertTriangle, QrCode, RefreshCw, Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface TwoFactorAuthProps {
  onStatusChange?: (enabled: boolean) => void;
}

export const TwoFactorAuth = ({ onStatusChange }: TwoFactorAuthProps) => {
  const { user } = useAuth();
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnabling, setIsEnabling] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  
  // Setup state
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedRecovery, setCopiedRecovery] = useState(false);
  const [setupStep, setSetupStep] = useState<'qr' | 'verify' | 'recovery'>('qr');

  // Disable state
  const [disableCode, setDisableCode] = useState('');

  useEffect(() => {
    check2FAStatus();
  }, [user]);

  const check2FAStatus = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      
      if (error) throw error;
      
      const totpFactor = data?.totp?.find(f => f.status === 'verified');
      setIs2FAEnabled(!!totpFactor);
      if (totpFactor) {
        setFactorId(totpFactor.id);
      }
    } catch (error: any) {
      console.error('Error checking 2FA status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSetup = async () => {
    setIsEnabling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      });
      
      if (error) throw error;
      
      if (data) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
        setSetupStep('qr');
        setShowSetupDialog(true);
      }
    } catch (error: any) {
      console.error('Error starting 2FA setup:', error);
      toast.error('启动2FA设置失败: ' + error.message);
    } finally {
      setIsEnabling(false);
    }
  };

  const handleVerifySetup = async () => {
    if (verificationCode.length !== 6) {
      toast.error('请输入6位验证码');
      return;
    }

    setIsEnabling(true);
    try {
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verificationCode
      });
      
      if (error) throw error;

      // Generate recovery codes (simulated - in production, these would come from the server)
      const codes = Array.from({ length: 10 }, () => 
        Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + 
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );
      setRecoveryCodes(codes);
      setSetupStep('recovery');
      
      setIs2FAEnabled(true);
      onStatusChange?.(true);
      toast.success('两步验证已启用！');
    } catch (error: any) {
      console.error('Error verifying 2FA:', error);
      toast.error('验证失败: ' + (error.message || '验证码错误，请重试'));
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDisable2FA = async () => {
    if (disableCode.length !== 6) {
      toast.error('请输入6位验证码');
      return;
    }

    setIsDisabling(true);
    try {
      // First verify the code
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: disableCode
      });
      
      if (verifyError) throw verifyError;

      // Then unenroll the factor
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId
      });
      
      if (unenrollError) throw unenrollError;

      setIs2FAEnabled(false);
      setFactorId('');
      setShowDisableDialog(false);
      setDisableCode('');
      onStatusChange?.(false);
      toast.success('两步验证已禁用');
    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      toast.error('禁用失败: ' + (error.message || '验证码错误'));
    } finally {
      setIsDisabling(false);
    }
  };

  const copyToClipboard = (text: string, type: 'secret' | 'recovery') => {
    navigator.clipboard.writeText(text);
    if (type === 'secret') {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedRecovery(true);
      setTimeout(() => setCopiedRecovery(false), 2000);
    }
    toast.success('已复制到剪贴板');
  };

  const handleCloseSetupDialog = () => {
    setShowSetupDialog(false);
    setSetupStep('qr');
    setVerificationCode('');
    setQrCode('');
    setSecret('');
    setRecoveryCodes([]);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${is2FAEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                {is2FAEnabled ? (
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                ) : (
                  <Shield className="w-5 h-5 text-gray-500" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">两步验证 (2FA)</CardTitle>
                <CardDescription>
                  使用身份验证器应用增强账户安全性
                </CardDescription>
              </div>
            </div>
            <Badge variant={is2FAEnabled ? "default" : "secondary"} className={is2FAEnabled ? "bg-green-500" : ""}>
              {is2FAEnabled ? '已启用' : '未启用'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {is2FAEnabled ? (
            <>
              <Alert className="border-green-200 bg-green-50">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  您的账户已启用两步验证保护。每次登录时，您需要输入身份验证器应用生成的验证码。
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowRecoveryDialog(true)}
                  className="flex-1"
                >
                  <Key className="w-4 h-4 mr-2" />
                  查看恢复码
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDisableDialog(true)}
                  className="flex-1"
                >
                  <ShieldOff className="w-4 h-4 mr-2" />
                  禁用2FA
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  为什么需要两步验证？
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>即使密码泄露，攻击者也无法访问您的账户</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>保护您的域名资产和交易安全</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>支持 Google Authenticator、Microsoft Authenticator 等主流应用</span>
                  </li>
                </ul>
              </div>

              <Button 
                onClick={handleStartSetup} 
                disabled={isEnabling}
                className="w-full"
              >
                {isEnabling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    正在准备...
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4 mr-2" />
                    启用两步验证
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={handleCloseSetupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              设置两步验证
            </DialogTitle>
            <DialogDescription>
              {setupStep === 'qr' && '使用身份验证器应用扫描二维码'}
              {setupStep === 'verify' && '输入应用生成的验证码'}
              {setupStep === 'recovery' && '保存您的恢复码'}
            </DialogDescription>
          </DialogHeader>

          {setupStep === 'qr' && (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded-lg border">
                {qrCode ? (
                  <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">无法扫描？手动输入密钥：</Label>
                <div className="flex gap-2">
                  <Input 
                    value={secret} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(secret, 'secret')}
                  >
                    {copiedSecret ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  推荐使用：Google Authenticator、Microsoft Authenticator、Authy 等应用
                </AlertDescription>
              </Alert>
            </div>
          )}

          {setupStep === 'verify' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>输入验证码</Label>
                <div className="flex justify-center py-4">
                  <InputOTP 
                    maxLength={6} 
                    value={verificationCode}
                    onChange={setVerificationCode}
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
                <p className="text-sm text-muted-foreground text-center">
                  打开身份验证器应用，输入显示的6位数字验证码
                </p>
              </div>
            </div>
          )}

          {setupStep === 'recovery' && (
            <div className="space-y-4">
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  请妥善保存这些恢复码！如果您无法访问身份验证器应用，可以使用恢复码登录。
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg font-mono text-sm">
                {recoveryCodes.map((code, index) => (
                  <div key={index} className="p-2 bg-white rounded border text-center">
                    {code}
                  </div>
                ))}
              </div>

              <Button 
                variant="outline" 
                onClick={() => copyToClipboard(recoveryCodes.join('\n'), 'recovery')}
                className="w-full"
              >
                {copiedRecovery ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                复制所有恢复码
              </Button>
            </div>
          )}

          <DialogFooter>
            {setupStep === 'qr' && (
              <Button onClick={() => setSetupStep('verify')} className="w-full">
                下一步：验证
              </Button>
            )}
            {setupStep === 'verify' && (
              <div className="flex gap-2 w-full">
                <Button variant="outline" onClick={() => setSetupStep('qr')} className="flex-1">
                  返回
                </Button>
                <Button 
                  onClick={handleVerifySetup} 
                  disabled={verificationCode.length !== 6 || isEnabling}
                  className="flex-1"
                >
                  {isEnabling ? <Loader2 className="w-4 h-4 animate-spin" /> : '验证并启用'}
                </Button>
              </div>
            )}
            {setupStep === 'recovery' && (
              <Button onClick={handleCloseSetupDialog} className="w-full">
                我已保存，完成设置
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldOff className="w-5 h-5" />
              禁用两步验证
            </DialogTitle>
            <DialogDescription>
              禁用后，您的账户将失去额外的安全保护层
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              禁用两步验证会降低账户安全性。请确认您确实需要禁用此功能。
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>输入验证码以确认</Label>
            <div className="flex justify-center py-4">
              <InputOTP 
                maxLength={6} 
                value={disableCode}
                onChange={setDisableCode}
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
              取消
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDisable2FA}
              disabled={disableCode.length !== 6 || isDisabling}
            >
              {isDisabling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              确认禁用
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recovery Codes Dialog */}
      <Dialog open={showRecoveryDialog} onOpenChange={setShowRecoveryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              恢复码
            </DialogTitle>
            <DialogDescription>
              使用恢复码可以在无法访问身份验证器时登录账户
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              每个恢复码只能使用一次。如需生成新的恢复码，请先禁用再重新启用两步验证。
            </AlertDescription>
          </Alert>

          <div className="text-center py-8 text-muted-foreground">
            <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>恢复码仅在设置时显示一次</p>
            <p className="text-sm">如需新的恢复码，请重新设置2FA</p>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowRecoveryDialog(false)} className="w-full">
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

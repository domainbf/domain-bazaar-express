import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle, Info } from 'lucide-react';

interface VerificationOptionsProps {
  onStartVerification: (method: string) => void;
}

export const VerificationOptions = ({ onStartVerification }: VerificationOptionsProps) => {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          DNS TXT记录验证
        </CardTitle>
        <CardDescription>
          通过在您的域名DNS设置中添加TXT记录来验证域名所有权
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>推荐方式</strong> - DNS TXT记录验证是最可靠和安全的验证方法
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <h4 className="font-medium">验证步骤：</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>登录您的域名DNS管理面板（如阿里云、腾讯云、Cloudflare等）</li>
            <li>添加一条新的TXT记录</li>
            <li>主机记录（Host）填写：<code className="bg-muted px-2 py-1 rounded">_domainverify</code></li>
            <li>记录值（Value）将在点击"开始验证"后显示</li>
            <li>保存DNS记录并等待生效（通常需要3-10分钟，最长可达24-48小时）</li>
            <li>点击"检查验证"按钮完成验证</li>
          </ol>
        </div>
        
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm space-y-1">
            <div><strong>验证原理：</strong></div>
            <div>系统会通过DNS查询检查您域名的TXT记录，确认记录值与生成的验证码匹配。</div>
            <div className="mt-2"><strong>常见问题：</strong></div>
            <ul className="list-disc list-inside ml-2">
              <li>DNS记录生效时间因服务商而异</li>
              <li>确保主机记录正确填写为 <code className="bg-muted px-1 rounded">_domainverify</code>（不含域名）</li>
              <li>完整记录名称应为 <code className="bg-muted px-1 rounded">_domainverify.yourdomain.com</code></li>
              <li>某些DNS服务商会自动添加域名后缀</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => onStartVerification('dns')}
          className="w-full"
        >
          开始DNS验证
        </Button>
      </CardFooter>
    </Card>
  );
};

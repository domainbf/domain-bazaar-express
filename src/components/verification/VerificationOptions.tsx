
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, File, Code, Database, Mail } from 'lucide-react';
import { useVerificationService } from '@/hooks/verification/useVerificationService';
import { useIsMobile } from "@/hooks/use-mobile";

interface VerificationOptionsProps {
  onStartVerification: (method: string) => void;
}

export const VerificationOptions = ({ onStartVerification }: VerificationOptionsProps) => {
  const { getVerificationMethods } = useVerificationService();
  const [verificationMethod, setVerificationMethod] = useState('dns');
  const isMobile = useIsMobile();
  
  const methods = getVerificationMethods();
  
  const getIcon = (id: string) => {
    switch(id) {
      case 'dns': return <Shield className="w-5 h-5 text-primary" />;
      case 'file': return <File className="w-5 h-5 text-primary" />;
      case 'html': return <Code className="w-5 h-5 text-primary" />;
      case 'whois': return <Database className="w-5 h-5 text-primary" />;
      case 'email': return <Mail className="w-5 h-5 text-primary" />;
      default: return <Shield className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>验证域名所有权</CardTitle>
        <CardDescription>
          验证您的域名可以证明您拥有该域名，并增加买家的信任度。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="dns" onValueChange={setVerificationMethod} className="w-full">
          <TabsList className={`mb-4 ${isMobile ? 'flex flex-col space-y-2 w-full h-auto' : ''}`}>
            {methods.map(method => (
              <TabsTrigger 
                key={method.id} 
                value={method.id}
                className={`${isMobile ? 'w-full justify-start' : ''}`}
              >
                <span className="flex items-center">
                  {getIcon(method.id)}
                  <span className="ml-2">{method.name}</span>
                  {method.recommended && (
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      推荐
                    </span>
                  )}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="dns" className="space-y-4">
            <div className="space-y-4">
              <p className="font-medium">通过 DNS TXT 记录验证域名所有权（推荐）</p>
              <p className="text-sm text-muted-foreground">这是最安全和可靠的验证方式，需要登录域名DNS管理后台添加记录。</p>
              <div className={`${isMobile ? 'overflow-x-auto' : ''} bg-muted p-4 rounded-md space-y-3`}>
                <p className="text-sm font-medium">验证步骤：</p>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>点击"开始验证"按钮获取您的验证码</li>
                  <li>登录到您的域名DNS服务商（如阿里云、腾讯云、Cloudflare等）</li>
                  <li>添加一条新的 TXT 记录：
                    <ul className="ml-6 mt-1 space-y-1 list-disc list-inside">
                      <li><strong>记录类型：</strong>TXT</li>
                      <li><strong>主机记录：</strong>_domainverify（或完整的 _domainverify.yourdomain.com）</li>
                      <li><strong>记录值：</strong>系统生成的验证码</li>
                      <li><strong>TTL：</strong>600 或默认值</li>
                    </ul>
                  </li>
                  <li>保存DNS记录后等待3-10分钟让DNS生效</li>
                  <li>返回本页面点击"检查验证状态"按钮</li>
                </ol>
                <div className="mt-3 p-3 bg-background rounded border border-border">
                  <p className="text-xs font-medium text-foreground mb-1">💡 重要提示：</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• DNS记录通常需要3-10分钟生效，部分服务商可能需要更长时间</li>
                    <li>• 确保主机记录填写为 <code className="bg-muted px-1 rounded">_domainverify</code>，不要包含域名部分</li>
                    <li>• 如果验证失败，请检查DNS记录是否正确添加并已生效</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="file" className="space-y-4">
            <div className="space-y-4">
              <p className="font-medium">通过服务器文件验证域名所有权</p>
              <p className="text-sm text-muted-foreground">需要您有域名网站的文件上传权限。</p>
              <div className={`${isMobile ? 'overflow-x-auto' : ''} bg-muted p-4 rounded-md space-y-3`}>
                <p className="text-sm font-medium">验证步骤：</p>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>点击"开始验证"按钮获取验证码</li>
                  <li>在网站根目录创建 <code className="bg-background px-1 rounded">/.well-known/</code> 文件夹</li>
                  <li>在该文件夹下创建 <code className="bg-background px-1 rounded">domain-verification.txt</code> 文件</li>
                  <li>将验证码粘贴到文件中并保存</li>
                  <li>确保文件可通过 <code className="bg-background px-1 rounded">https://yourdomain.com/.well-known/domain-verification.txt</code> 访问</li>
                  <li>返回本页面点击"检查验证状态"</li>
                </ol>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="html" className="space-y-4">
            <div className="space-y-4">
              <p className="font-medium">通过 HTML Meta 标签验证域名所有权</p>
              <p className="text-sm text-muted-foreground">需要修改网站首页的 HTML 代码。</p>
              <div className={`${isMobile ? 'overflow-x-auto' : ''} bg-muted p-4 rounded-md space-y-3`}>
                <p className="text-sm font-medium">验证步骤：</p>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>点击"开始验证"按钮获取验证码</li>
                  <li>编辑您网站的首页 HTML 文件</li>
                  <li>在 <code className="bg-background px-1 rounded">&lt;head&gt;</code> 部分添加 meta 标签</li>
                  <li>保存并上传更新后的文件</li>
                  <li>返回本页面点击"检查验证状态"</li>
                </ol>
                <div className="mt-3 p-3 bg-background rounded border border-border">
                  <p className="text-xs font-medium mb-2">Meta 标签示例：</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded block overflow-x-auto">
                    &lt;meta name="domain-verification" content="您的验证码"&gt;
                  </code>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="whois" className="space-y-4">
            <div className="space-y-4">
              <p>在域名的WHOIS信息中添加验证码。</p>
              <div className={`${isMobile ? 'overflow-x-auto' : ''} bg-gray-50 p-4 rounded-md`}>
                <p className="text-sm font-medium mb-1">一旦您开始验证，您需要：</p>
                <p className="text-sm text-gray-600">1. 登录您的域名注册商账户</p>
                <p className="text-sm text-gray-600">2. 在域名WHOIS信息的备注或描述字段中添加我们提供的验证码</p>
                <p className="text-sm text-gray-600">3. 保存更改并等待WHOIS信息更新（可能需要24小时）</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="email" className="space-y-4">
            <div className="space-y-4">
              <p>通过域名管理员邮箱验证所有权。</p>
              <div className={`${isMobile ? 'overflow-x-auto' : ''} bg-gray-50 p-4 rounded-md`}>
                <p className="text-sm font-medium mb-1">一旦您开始验证，您需要：</p>
                <p className="text-sm text-gray-600">1. 我们将向与域名相关联的管理员邮箱发送验证邮件</p>
                <p className="text-sm text-gray-600">2. 点击验证邮件中的链接确认所有权</p>
                <p className="text-sm text-gray-600">3. 验证将在您点击邮件中的链接后立即完成</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className={isMobile ? "flex flex-col" : ""}>
        <Button 
          onClick={() => onStartVerification(verificationMethod)}
          className={isMobile ? "w-full" : ""}
        >
          开始验证
        </Button>
      </CardFooter>
    </Card>
  );
};

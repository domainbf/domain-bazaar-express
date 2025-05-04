
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
              <p>添加TXT记录到您域名的DNS设置来验证所有权。</p>
              <div className={`${isMobile ? 'overflow-x-auto' : ''} bg-gray-50 p-4 rounded-md`}>
                <p className="text-sm font-medium mb-1">一旦您开始验证，您需要添加一个TXT记录：</p>
                <p className="text-sm text-gray-600">记录类型: TXT</p>
                <p className="text-sm text-gray-600">记录名称: _domainverify.yourdomain.com</p>
                <p className="text-sm text-gray-600">记录值: 我们将提供的验证码</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="file" className="space-y-4">
            <div className="space-y-4">
              <p>上传验证文件到您域名的Web服务器。</p>
              <div className={`${isMobile ? 'overflow-x-auto' : ''} bg-gray-50 p-4 rounded-md`}>
                <p className="text-sm font-medium mb-1">一旦您开始验证，您需要：</p>
                <p className="text-sm text-gray-600">1. 在此路径创建文件：/.well-known/domain-verification.txt</p>
                <p className="text-sm text-gray-600">2. 添加我们将提供的验证码到文件中</p>
                <p className="text-sm text-gray-600">3. 确保该文件可通过您的域名访问</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="html" className="space-y-4">
            <div className="space-y-4">
              <p>在您网站的HTML页面中添加Meta标签。</p>
              <div className={`${isMobile ? 'overflow-x-auto' : ''} bg-gray-50 p-4 rounded-md`}>
                <p className="text-sm font-medium mb-1">一旦您开始验证，您需要：</p>
                <p className="text-sm text-gray-600">1. 在您网站首页的&lt;head&gt;部分添加以下meta标签</p>
                <p className="text-sm font-medium mt-2">Meta标签示例：</p>
                <div className="bg-gray-100 p-2 rounded overflow-x-auto">
                  <code className="text-sm">&lt;meta name="domain-verification" content="验证码将在此处显示"&gt;</code>
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

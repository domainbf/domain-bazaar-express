import { DomainVerification } from '@/types/domain';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy, RefreshCw, Database, Mail, AlertTriangle } from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";
import { CopyButton } from "@/components/common/CopyButton";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useVerificationProcess } from '@/hooks/verification/useVerificationProcess';
import { DnsRecordChecker } from './DnsRecordChecker';

interface VerificationInstructionsProps {
  verification: DomainVerification;
  domainName: string;
  onRefresh: () => void;
  onCheck: () => void;
}

export const VerificationInstructions = ({ 
  verification, 
  domainName, 
  onRefresh, 
  onCheck 
}: VerificationInstructionsProps) => {
  const isMobile = useIsMobile();
  const { resendVerificationEmail } = useVerificationProcess();
  
  const renderExpiryInfo = () => {
    if (!verification.expiry_date) return null;
    
    const expiryDate = new Date(verification.expiry_date);
    const now = new Date();
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            此验证已过期。请重新开始验证流程。
          </AlertDescription>
        </Alert>
      );
    }
    
    if (daysLeft <= 2) {
      return (
        <Alert variant="warning" className="mb-4">
          <AlertDescription>
            此验证将在 {daysLeft} 天后过期。请尽快完成验证。
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <Alert className="mb-4">
        <AlertDescription>
          此验证将在 {daysLeft} 天后过期。
        </AlertDescription>
      </Alert>
    );
  };

  const handleResendEmail = async () => {
    if (verification.verification_type === 'email') {
      await resendVerificationEmail(verification.id);
    }
  };
  
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>完成验证</CardTitle>
        <CardDescription>
          按照以下步骤验证您的域名所有权
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderExpiryInfo()}
        
        {verification.verification_type === 'dns' ? (
          <div className="space-y-4">
            <DnsRecordChecker 
              recordName={verification.verification_data.recordName}
              expectedValue={verification.verification_data.recordValue}
              domainName={domainName}
            />
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">📋 DNS TXT记录设置指南</h4>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-blue-800 mb-2">请在您的DNS服务商添加以下TXT记录：</p>
                  <div className="bg-white p-3 rounded-md space-y-2 border border-blue-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">记录类型:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">TXT</code>
                        <CopyButton value="TXT" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">主机记录:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">_domainverify</code>
                        <CopyButton value="_domainverify" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-600">完整记录名称:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded flex-1 break-all">
                          {verification.verification_data.recordName}
                        </code>
                        <CopyButton value={verification.verification_data.recordName} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-600">记录值:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded flex-1 break-all">
                          {verification.verification_data.recordValue}
                        </code>
                        <CopyButton value={verification.verification_data.recordValue} />
                      </div>
                    </div>
                  </div>
                </div>

                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-sm text-yellow-800">
                    <strong>重要提示：</strong>
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                      <li><strong>主机记录</strong>只需填写 <code className="bg-yellow-100 px-1 rounded">_domainverify</code></li>
                      <li>不要填写完整域名（如 _domainverify.{domainName}）</li>
                      <li>大多数DNS服务商会自动添加域名后缀</li>
                      <li>有些服务商显示"主机记录"，有些显示"名称"或"Host"</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <h5 className="text-sm font-semibold text-blue-900">常见DNS服务商设置方法：</h5>
                  <div className="space-y-2 text-xs text-gray-700">
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <strong>阿里云/万网：</strong>
                      <ul className="mt-1 ml-4 list-disc space-y-0.5">
                        <li>记录类型选择：TXT</li>
                        <li>主机记录填写：<code className="bg-gray-100 px-1">_domainverify</code></li>
                        <li>记录值粘贴：验证码</li>
                        <li>TTL默认即可（建议600秒）</li>
                      </ul>
                    </div>
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <strong>腾讯云DNSPod：</strong>
                      <ul className="mt-1 ml-4 list-disc space-y-0.5">
                        <li>记录类型：TXT</li>
                        <li>主机记录：<code className="bg-gray-100 px-1">_domainverify</code></li>
                        <li>记录值：粘贴完整验证码</li>
                        <li>TTL：600（或默认）</li>
                      </ul>
                    </div>
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <strong>Cloudflare：</strong>
                      <ul className="mt-1 ml-4 list-disc space-y-0.5">
                        <li>Type: TXT</li>
                        <li>Name: <code className="bg-gray-100 px-1">_domainverify</code></li>
                        <li>Content: 粘贴验证码</li>
                        <li>TTL: Auto（或自定义）</li>
                      </ul>
                    </div>
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <strong>GoDaddy：</strong>
                      <ul className="mt-1 ml-4 list-disc space-y-0.5">
                        <li>Type: TXT</li>
                        <li>Host: <code className="bg-gray-100 px-1">_domainverify</code></li>
                        <li>TXT Value: 粘贴验证码</li>
                        <li>TTL: 1 Hour（或默认）</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Alert>
                  <Database className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>⏱️ DNS生效时间：</strong>
                    <ul className="mt-1 space-y-0.5 list-disc list-inside ml-2">
                      <li>国内DNS服务商：通常3-10分钟</li>
                      <li>国际DNS服务商：可能需要10-30分钟</li>
                      <li>全球完全生效：最长24-48小时</li>
                      <li>建议：添加记录后等待10分钟，然后使用上方的"DNS记录实时检查"工具验证</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>
        ) : verification.verification_type === 'file' ? (
          <div className="space-y-4">
            <p>在您的Web服务器上创建验证文件：</p>
            <div className={`${isMobile ? 'overflow-x-auto' : ''} bg-gray-50 p-4 rounded-md space-y-3`}>
              <div>
                <p className="text-sm font-medium">文件位置:</p>
                <div className="flex items-center mt-1">
                  <p className="text-sm font-mono bg-gray-100 p-1 rounded flex-1">
                    {verification.verification_data.fileLocation}
                  </p>
                  <CopyButton value={verification.verification_data.fileLocation} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">文件内容:</p>
                <div className="flex items-center mt-1">
                  <p className="text-sm font-mono bg-gray-100 p-1 rounded flex-1">
                    {verification.verification_data.fileContent}
                  </p>
                  <CopyButton value={verification.verification_data.fileContent} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">文件URL:</p>
                <div className="flex items-center mt-1">
                  <p className="text-sm font-mono bg-gray-100 p-1 rounded flex-1">
                    https://{domainName}{verification.verification_data.fileLocation}
                  </p>
                  <a 
                    href={`https://${domainName}${verification.verification_data.fileLocation}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="ml-2 inline-flex"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : verification.verification_type === 'whois' ? (
          <div className="space-y-4">
            <p>在您的域名WHOIS信息中添加以下验证码：</p>
            <div className={`${isMobile ? 'overflow-x-auto' : ''} bg-gray-50 p-4 rounded-md space-y-3`}>
              <div>
                <p className="text-sm font-medium">验证码:</p>
                <div className="flex items-center mt-1">
                  <p className="text-sm font-mono bg-gray-100 p-1 rounded flex-1 overflow-x-auto">
                    {verification.verification_data.tokenValue}
                  </p>
                  <CopyButton value={verification.verification_data.tokenValue} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-sm font-medium">操作步骤:</p>
                <ol className="mt-2 space-y-2 text-sm text-gray-600 list-decimal pl-5">
                  <li>登录到您的域名注册商账户</li>
                  <li>找到域名 {domainName} 的WHOIS信息或联系信息设置</li>
                  <li>将上述验证码添加到备注字段或描述字段中</li>
                  <li>保存更改</li>
                  <li>等待WHOIS信息更新后点击"检查验证"按钮</li>
                </ol>
              </div>
              <div className="flex items-center mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                <Database className="h-4 w-4 text-yellow-600 mr-2 flex-shrink-0" />
                <p className="text-xs text-yellow-700">
                  WHOIS信息更新可能需要24-48小时才能生效，请耐心等待。
                </p>
              </div>
            </div>
          </div>
        ) : verification.verification_type === 'email' ? (
          <div className="space-y-4">
            <p>通过邮箱验证域名所有权：</p>
            <div className={`${isMobile ? 'overflow-x-auto' : ''} bg-gray-50 p-4 rounded-md space-y-3`}>
              <div>
                <p className="text-sm font-medium">验证邮件已发送至:</p>
                <div className="flex items-center mt-1">
                  <p className="text-sm font-mono bg-gray-100 p-1 rounded flex-1">
                    {verification.verification_data.adminEmail}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-sm font-medium">操作步骤:</p>
                <ol className="mt-2 space-y-2 text-sm text-gray-600 list-decimal pl-5">
                  <li>检查您的邮箱 {verification.verification_data.adminEmail}</li>
                  <li>在邮件中找到验证链接并点击</li>
                  <li>验证完成后，返回此页面点击"检查验证"按钮</li>
                </ol>
              </div>
              <div className="flex items-center mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                <Mail className="h-4 w-4 text-yellow-600 mr-2 flex-shrink-0" />
                <p className="text-xs text-yellow-700">
                  如果您没有收到验证邮件，可以点击下方"重新发送验证邮件"按钮。
                </p>
              </div>
              <div className="flex items-center mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                <AlertTriangle className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  请确保 {verification.verification_data.adminEmail} 是您能够访问的邮箱地址。
                </p>
              </div>
            </div>
          </div>
        ) : verification.verification_type === 'html' ? (
          <div className="space-y-4">
            <p>在您的网站HTML页面中添加Meta标签：</p>
            <div className={`${isMobile ? 'overflow-x-auto' : ''} bg-gray-50 p-4 rounded-md space-y-3`}>
              <div>
                <p className="text-sm font-medium">Meta标签:</p>
                <div className="flex items-center mt-1">
                  <p className="text-sm font-mono bg-gray-100 p-1 rounded flex-1 overflow-x-auto">
                    {`<meta name="${verification.verification_data.metaName}" content="${verification.verification_data.token}">`}
                  </p>
                  <CopyButton value={`<meta name="${verification.verification_data.metaName}" content="${verification.verification_data.token}">`} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">放置位置:</p>
                <p className="text-sm text-gray-600">
                  将上述Meta标签添加到网站首页的&lt;head&gt;部分
                </p>
              </div>
            </div>
          </div>
        ) : (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              未知的验证类型: {verification.verification_type}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className={`${isMobile ? 'flex-col space-y-2' : verification.verification_type === 'email' ? 'grid grid-cols-3 gap-2' : 'flex justify-between'}`}>
        <Button 
          variant="outline" 
          onClick={onRefresh}
          className={isMobile ? "w-full" : ""}
        >
          <RefreshCw className="w-4 h-4 mr-2" /> 刷新状态
        </Button>
        
        {verification.verification_type === 'email' && (
          <Button 
            variant="outline" 
            onClick={handleResendEmail}
            className={isMobile ? "w-full" : ""}
          >
            <Mail className="w-4 h-4 mr-2" /> 重新发送验证邮件
          </Button>
        )}
        
        <Button 
          onClick={onCheck}
          className={isMobile ? "w-full" : ""}
          disabled={verification.verification_type === 'whois'}
        >
          {verification.verification_type === 'whois' ? '等待管理员审核' : '检查验证'}
        </Button>
      </CardFooter>
    </Card>
  );
};

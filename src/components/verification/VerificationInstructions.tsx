import { DomainVerification } from '@/types/domain';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy, RefreshCw, Database, Mail, AlertTriangle } from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";
import { CopyButton } from "@/components/common/CopyButton";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useVerificationProcess } from '@/hooks/verification/useVerificationProcess';
import { SimpleDnsChecker } from './SimpleDnsChecker';

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
        <Alert className="mb-4 border-yellow-500/50 bg-yellow-500/10 dark:bg-yellow-950/20">
          <AlertDescription className="text-yellow-600 dark:text-yellow-400 dark:text-yellow-300">
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
            <SimpleDnsChecker 
              recordName={verification.verification_data.recordName}
              expectedValue={verification.verification_data.recordValue}
              domainName={domainName}
            />
            
            <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-lg border border-primary/20">
              <h4 className="font-semibold text-foreground mb-3">📋 DNS TXT记录设置指南</h4>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">请在您的DNS服务商添加以下TXT记录：</p>
                  <div className="bg-card p-3 rounded-md space-y-2 border border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">记录类型:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded text-foreground">TXT</code>
                        <CopyButton value="TXT" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">主机记录:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded text-foreground">_domainverify</code>
                        <CopyButton value="_domainverify" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">完整记录名称:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded text-foreground flex-1 break-all">
                          {verification.verification_data.recordName}
                        </code>
                        <CopyButton value={verification.verification_data.recordName} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">记录值:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded text-foreground flex-1 break-all">
                          {verification.verification_data.recordValue}
                        </code>
                        <CopyButton value={verification.verification_data.recordValue} />
                      </div>
                    </div>
                  </div>
                </div>

                <Alert className="border-yellow-500/50 bg-yellow-500/10 dark:bg-yellow-950/20">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <AlertDescription className="text-sm text-yellow-600 dark:text-yellow-400 dark:text-yellow-300">
                    <strong>重要提示：</strong>
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                      <li><strong>主机记录</strong>只需填写 <code className="bg-yellow-500/15 dark:bg-yellow-900/50 px-1 rounded">_domainverify</code></li>
                      <li>不要填写完整域名（如 _domainverify.{domainName}）</li>
                      <li>大多数DNS服务商会自动添加域名后缀</li>
                      <li>有些服务商显示"主机记录"，有些显示"名称"或"Host"</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <h5 className="text-sm font-semibold text-foreground">常见DNS服务商设置方法：</h5>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    {[
                      { name: '阿里云/万网', steps: ['记录类型选择：TXT', '主机记录填写：_domainverify', '记录值粘贴：验证码', 'TTL默认即可（建议600秒）'] },
                      { name: '腾讯云DNSPod', steps: ['记录类型：TXT', '主机记录：_domainverify', '记录值：粘贴完整验证码', 'TTL：600（或默认）'] },
                      { name: 'Cloudflare', steps: ['Type: TXT', 'Name: _domainverify', 'Content: 粘贴验证码', 'TTL: Auto（或自定义）'] },
                      { name: 'GoDaddy', steps: ['Type: TXT', 'Host: _domainverify', 'TXT Value: 粘贴验证码', 'TTL: 1 Hour（或默认）'] },
                    ].map(({ name, steps }) => (
                      <div key={name} className="bg-muted/50 p-2 rounded border border-border">
                        <strong className="text-foreground">{name}：</strong>
                        <ul className="mt-1 ml-4 list-disc space-y-0.5">
                          {steps.map((s, i) => (
                            <li key={i}>{s.includes('_domainverify') && !s.startsWith('记录') && !s.startsWith('主机') && !s.startsWith('Host') && !s.startsWith('Name')
                              ? s
                              : s.includes('_domainverify')
                                ? <span>{s.split('_domainverify')[0]}<code className="bg-muted px-1 rounded text-foreground">_domainverify</code>{s.split('_domainverify')[1]}</span>
                                : s
                            }</li>
                          ))}
                        </ul>
                      </div>
                    ))}
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
            <p className="text-foreground">在您的Web服务器上创建验证文件：</p>
            <div className={`${isMobile ? 'overflow-x-auto' : ''} bg-muted p-4 rounded-md space-y-3`}>
              <div>
                <p className="text-sm font-medium text-foreground">文件位置:</p>
                <div className="flex items-center mt-1">
                  <p className="text-sm font-mono bg-card p-1 rounded flex-1 text-foreground">
                    {verification.verification_data.fileLocation}
                  </p>
                  <CopyButton value={verification.verification_data.fileLocation} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">文件内容:</p>
                <div className="flex items-center mt-1">
                  <p className="text-sm font-mono bg-card p-1 rounded flex-1 text-foreground">
                    {verification.verification_data.fileContent}
                  </p>
                  <CopyButton value={verification.verification_data.fileContent} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">文件URL:</p>
                <div className="flex items-center mt-1">
                  <p className="text-sm font-mono bg-card p-1 rounded flex-1 text-foreground">
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
        ) : verification.verification_type === 'email' ? (
          <div className="space-y-4">
            <p className="text-foreground">通过邮箱验证域名所有权：</p>
            <div className={`${isMobile ? 'overflow-x-auto' : ''} bg-muted p-4 rounded-md space-y-3`}>
              <div>
                <p className="text-sm font-medium text-foreground">验证邮件已发送至:</p>
                <div className="flex items-center mt-1">
                  <p className="text-sm font-mono bg-card p-1 rounded flex-1 text-foreground">
                    {verification.verification_data.adminEmail}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-sm font-medium text-foreground">操作步骤:</p>
                <ol className="mt-2 space-y-2 text-sm text-muted-foreground list-decimal pl-5">
                  <li>检查您的邮箱 {verification.verification_data.adminEmail}</li>
                  <li>在邮件中找到验证链接并点击</li>
                  <li>验证完成后，返回此页面点击"检查验证"按钮</li>
                </ol>
              </div>
              <div className="flex items-center mt-3 p-2 bg-yellow-500/10 dark:bg-yellow-950/20 rounded border border-yellow-500/30 dark:border-yellow-800">
                <Mail className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mr-2 shrink-0" />
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  如果您没有收到验证邮件，可以点击下方"重新发送验证邮件"按钮。
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

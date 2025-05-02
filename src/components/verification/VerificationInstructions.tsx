
import { DomainVerification } from '@/types/domain';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy, RefreshCw } from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";
import { CopyButton } from "@/components/common/CopyButton";

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
  
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>完成验证</CardTitle>
        <CardDescription>
          按照以下步骤验证您的域名所有权
        </CardDescription>
      </CardHeader>
      <CardContent>
        {verification.verification_type === 'dns' ? (
          <div className="space-y-4">
            <p>添加以下TXT记录到您域名的DNS设置：</p>
            <div className={`${isMobile ? 'overflow-x-auto' : ''} bg-gray-50 p-4 rounded-md space-y-3`}>
              <div>
                <p className="text-sm font-medium">记录类型:</p>
                <div className="flex items-center mt-1">
                  <p className="text-sm font-mono bg-gray-100 p-1 rounded flex-1">TXT</p>
                  <CopyButton value="TXT" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">记录名称:</p>
                <div className="flex items-center mt-1">
                  <p className="text-sm font-mono bg-gray-100 p-1 rounded flex-1 overflow-x-auto">
                    {verification.verification_data.recordName}
                  </p>
                  <CopyButton value={verification.verification_data.recordName} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">记录值:</p>
                <div className="flex items-center mt-1">
                  <p className="text-sm font-mono bg-gray-100 p-1 rounded flex-1 overflow-x-auto">
                    {verification.verification_data.recordValue}
                  </p>
                  <CopyButton value={verification.verification_data.recordValue} />
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">DNS更改可能需要24-48小时才能生效，但通常会更快。</p>
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
        ) : (
          <div className="space-y-4">
            <p>在您的网站HTML页面中添加Meta标签：</p>
            <div className={`${isMobile ? 'overflow-x-auto' : ''} bg-gray-50 p-4 rounded-md space-y-3`}>
              <div>
                <p className="text-sm font-medium">Meta标签:</p>
                <div className="flex items-center mt-1">
                  <p className="text-sm font-mono bg-gray-100 p-1 rounded flex-1 overflow-x-auto">
                    {verification.verification_data.metaTagContent}
                  </p>
                  <CopyButton value={verification.verification_data.metaTagContent} />
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
        )}
      </CardContent>
      <CardFooter className={`${isMobile ? 'flex-col space-y-2' : 'flex justify-between'}`}>
        <Button 
          variant="outline" 
          onClick={onRefresh}
          className={isMobile ? "w-full" : ""}
        >
          <RefreshCw className="w-4 h-4 mr-2" /> 刷新状态
        </Button>
        <Button 
          onClick={onCheck}
          className={isMobile ? "w-full" : ""}
        >
          检查验证
        </Button>
      </CardFooter>
    </Card>
  );
};

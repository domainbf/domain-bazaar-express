import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface VerificationResultProps {
  success: boolean;
  message: string;
  onDismiss?: () => void;
}

export const VerificationResult = ({ success, message, onDismiss }: VerificationResultProps) => {
  // 解析消息内容
  const parseMessage = (msg: string) => {
    const lines = msg.split('\n').filter(line => line.trim());
    
    // 提取关键信息
    const mainMessage = lines[0] || msg;
    const reasons: string[] = [];
    const suggestions: string[] = [];
    const dnsServers: string[] = [];
    
    let currentSection = '';
    
    lines.forEach(line => {
      if (line.includes('可能原因') || line.includes('📝 可能原因')) {
        currentSection = 'reasons';
      } else if (line.includes('操作建议') || line.includes('💡 操作建议') || line.includes('请确保')) {
        currentSection = 'suggestions';
      } else if (line.includes('DNS服务器查询') || line.includes('🔍 DNS服务器查询')) {
        currentSection = 'servers';
      } else if (currentSection === 'reasons' && (line.match(/^\d+\./) || line.includes('•'))) {
        reasons.push(line.replace(/^\d+\.\s*/, '').replace(/^•\s*/, '').trim());
      } else if (currentSection === 'suggestions' && (line.match(/^\d+\./) || line.includes('•'))) {
        suggestions.push(line.replace(/^\d+\.\s*/, '').replace(/^•\s*/, '').trim());
      } else if (currentSection === 'servers' && line.includes('DNS')) {
        dnsServers.push(line.trim());
      }
    });
    
    return { mainMessage, reasons, suggestions, dnsServers };
  };
  
  const { mainMessage, reasons, suggestions, dnsServers } = parseMessage(message);
  
  if (success) {
    return (
      <Alert className="border-green-500 bg-green-50 mb-6">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <AlertTitle className="text-green-800 text-lg">验证成功！</AlertTitle>
        <AlertDescription className="text-green-700 mt-2">
          {mainMessage}
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Card className="mb-6 border-red-200">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3 mb-4">
          <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-800 text-lg mb-2">验证失败</h3>
            <p className="text-red-700 mb-4">{mainMessage}</p>
          </div>
        </div>
        
        {dnsServers.length > 0 && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">DNS服务器查询结果</span>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              {dnsServers.map((server, idx) => (
                <div key={idx}>{server}</div>
              ))}
            </div>
          </div>
        )}
        
        {reasons.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-semibold text-yellow-800">可能原因</span>
            </div>
            <ul className="space-y-2 ml-6">
              {reasons.map((reason, idx) => (
                <li key={idx} className="text-sm text-gray-700 list-disc">{reason}</li>
              ))}
            </ul>
          </div>
        )}
        
        {suggestions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">操作建议</span>
            </div>
            <ul className="space-y-2 ml-6">
              {suggestions.map((suggestion, idx) => (
                <li key={idx} className="text-sm text-gray-700 list-disc">{suggestion}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

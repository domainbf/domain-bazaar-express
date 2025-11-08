import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Search, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SimpleDnsCheckerProps {
  recordName: string;
  expectedValue: string;
  domainName: string;
}

export const SimpleDnsChecker = ({ recordName, expectedValue, domainName }: SimpleDnsCheckerProps) => {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ verified: boolean; message: string } | null>(null);

  const checkDns = async () => {
    setChecking(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('check-domain-verification', {
        body: { 
          recordName,
          expectedValue,
          checkOnly: true
        }
      });

      if (error) throw error;

      setResult({
        verified: data?.verified || false,
        message: data?.message || '查询失败'
      });
    } catch (error: any) {
      console.error('DNS检查失败:', error);
      setResult({
        verified: false,
        message: 'DNS查询服务暂时不可用，请稍后重试'
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Search className="w-5 h-5" />
          DNS记录实时检查
        </CardTitle>
        <CardDescription>
          检查您的DNS TXT记录是否已经生效
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={checkDns} 
          disabled={checking}
          className="w-full"
        >
          {checking ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              正在查询DNS记录...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              检查DNS记录
            </>
          )}
        </Button>

        {result && (
          <Alert className={result.verified ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'}>
            {result.verified ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-yellow-600" />
            )}
            <AlertDescription className={result.verified ? 'text-green-800' : 'text-yellow-800'}>
              <div className="whitespace-pre-wrap">{result.message}</div>
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>说明：</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>此工具实时查询全球公共DNS服务器</li>
              <li>DNS记录通常需要3-10分钟生效</li>
              <li>如果显示未找到，请等待后再试</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

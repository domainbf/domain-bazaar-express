import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Search, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DnsRecordCheckerProps {
  recordName: string;
  expectedValue: string;
  domainName: string;
}

interface DnsCheckResult {
  found: boolean;
  values?: string[];
  error?: string;
  servers?: {
    google?: { found: boolean; values?: string[]; error?: string };
    cloudflare?: { found: boolean; values?: string[]; error?: string };
  };
}

export const DnsRecordChecker = ({ recordName, expectedValue, domainName }: DnsRecordCheckerProps) => {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<DnsCheckResult | null>(null);

  const checkDnsRecord = async () => {
    setChecking(true);
    setResult(null);

    try {
      let txtValues: string[] = [];
      let googleResult: any = { found: false, values: [] };
      let cloudflareResult: any = { found: false, values: [] };

      // 检查Google DNS
      try {
        const googleResponse = await fetch(
          `https://dns.google/resolve?name=${encodeURIComponent(recordName)}&type=TXT`,
          { 
            headers: { 'Cache-Control': 'no-cache' },
            mode: 'cors'
          }
        );

        if (googleResponse.ok) {
          const data = await googleResponse.json();
          const answers = Array.isArray(data.Answer) ? data.Answer : [];
          const googleValues = answers
            .filter((a: any) => a.type === 16 && typeof a.data === 'string')
            .map((a: any) => a.data.replace(/^\"|\"$/g, ''));
          
          googleValues.forEach(val => {
            if (!txtValues.includes(val)) txtValues.push(val);
          });
          
          googleResult = {
            found: googleValues.includes(expectedValue),
            values: googleValues
          };
        }
      } catch (err) {
        console.warn('Google DNS查询失败:', err);
        googleResult = { found: false, error: 'Google DNS查询失败' };
      }

      // 检查Cloudflare DNS
      try {
        const cfResponse = await fetch(
          `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(recordName)}&type=TXT`,
          { 
            headers: { 
              'Accept': 'application/dns-json',
              'Cache-Control': 'no-cache'
            },
            mode: 'cors'
          }
        );
        
        if (cfResponse.ok) {
          const cfData = await cfResponse.json();
          const cfAnswers = Array.isArray(cfData.Answer) ? cfData.Answer : [];
          const cfValues = cfAnswers
            .filter((a: any) => a.type === 16 && typeof a.data === 'string')
            .map((a: any) => a.data.replace(/^\"|\"$/g, ''));
          
          cfValues.forEach(val => {
            if (!txtValues.includes(val)) txtValues.push(val);
          });
          
          cloudflareResult = {
            found: cfValues.includes(expectedValue),
            values: cfValues
          };
        }
      } catch (err) {
        console.warn('Cloudflare DNS查询失败:', err);
        cloudflareResult = { found: false, error: 'Cloudflare DNS查询失败' };
      }

      setResult({
        found: txtValues.includes(expectedValue),
        values: txtValues,
        servers: {
          google: googleResult,
          cloudflare: cloudflareResult
        }
      });
    } catch (error: any) {
      console.error('DNS查询错误:', error);
      setResult({
        found: false,
        error: '网络连接失败，请检查您的网络连接后重试'
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
          onClick={checkDnsRecord} 
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
          <div className="space-y-3">
            {result.found ? (
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>验证成功！</strong> DNS记录已找到且值匹配。
                  <div className="mt-2 text-sm">
                    找到的记录值: <code className="bg-green-100 px-2 py-1 rounded">{expectedValue}</code>
                  </div>
                </AlertDescription>
              </Alert>
            ) : result.error ? (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>查询失败</strong>
                  <div className="mt-1 text-sm">{result.error}</div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-yellow-500 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>DNS记录未找到或值不匹配</strong>
                  {result.values && result.values.length > 0 ? (
                    <div className="mt-2 text-sm space-y-1">
                      <div>找到了TXT记录，但值不匹配：</div>
                      <div className="bg-yellow-100 p-2 rounded">
                        <div>期望值: <code className="text-xs">{expectedValue}</code></div>
                        <div className="mt-1">实际值: {result.values.map((v, i) => (
                          <code key={i} className="text-xs block">{v}</code>
                        ))}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-sm">
                      <div>未找到 <code className="bg-yellow-100 px-1 rounded">{recordName}</code> 的TXT记录</div>
                      <div className="mt-2 space-y-1">
                        <div><strong>可能原因：</strong></div>
                        <ul className="list-disc list-inside ml-2 space-y-1">
                          <li>DNS记录尚未添加</li>
                          <li>DNS记录还未生效（通常需要3-10分钟）</li>
                          <li>主机记录填写错误</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* 显示多个DNS服务器的查询结果 */}
            {result.servers && (
              <div className="mt-4 p-3 bg-muted rounded-lg space-y-2 text-sm">
                <div className="font-medium">DNS服务器查询详情：</div>
                
                {result.servers.google && (
                  <div className="flex items-start gap-2">
                    {result.servers.google.found ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    )}
                    <div>
                      <div className="font-medium">Google DNS (8.8.8.8):</div>
                      <div className="text-muted-foreground">
                        {result.servers.google.found 
                          ? '已找到匹配的记录' 
                          : result.servers.google.values?.length 
                            ? '找到记录但值不匹配' 
                            : '未找到记录'}
                      </div>
                    </div>
                  </div>
                )}

                {result.servers.cloudflare && (
                  <div className="flex items-start gap-2">
                    {result.servers.cloudflare.found ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    )}
                    <div>
                      <div className="font-medium">Cloudflare DNS (1.1.1.1):</div>
                      <div className="text-muted-foreground">
                        {result.servers.cloudflare.found 
                          ? '已找到匹配的记录' 
                          : result.servers.cloudflare.values?.length 
                            ? '找到记录但值不匹配' 
                            : result.servers.cloudflare.error || '未找到记录'}
                      </div>
                    </div>
                  </div>
                )}

                <Alert className="mt-3">
                  <AlertDescription className="text-xs">
                    💡 <strong>提示：</strong>如果不同DNS服务器返回不同结果，说明DNS记录正在全球传播中，请等待几分钟后再试。
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        )}

        <Alert>
          <AlertDescription className="text-sm space-y-2">
            <div><strong>DNS检查说明：</strong></div>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>此工具实时查询全球公共DNS服务器</li>
              <li>可以立即验证您的DNS设置是否正确</li>
              <li>如果显示未找到，请检查DNS设置后等待3-10分钟再试</li>
              <li>不同DNS服务器可能需要不同时间同步</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

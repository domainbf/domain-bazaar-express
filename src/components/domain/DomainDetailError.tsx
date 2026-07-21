import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCw, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  error?: Error | null;
  onRetry: () => void;
  autoRetrySeconds?: number;
}

// Classify the failure into a human message.
function classify(err?: Error | null, notFound = false) {
  if (notFound) {
    return { title: '未找到该域名', reason: '域名可能已下架、拼写有误或该链接已失效。' };
  }
  const msg = (err?.message || '').toLowerCase();
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout')) {
    return { title: '网络异常', reason: '与服务器的连接暂时不可用，请检查网络后重试。' };
  }
  if (msg.includes('permission') || msg.includes('rls')) {
    return { title: '暂无访问权限', reason: '该域名不对公开访问，请联系管理员。' };
  }
  if (msg.includes('rate') || msg.includes('429')) {
    return { title: '请求过于频繁', reason: '短时间内请求过多，请稍后再试。' };
  }
  return { title: '域名加载失败', reason: err?.message || '发生未知错误，请稍后重试。' };
}

export const DomainDetailError = ({ error, onRetry, autoRetrySeconds = 8 }: Props) => {
  const params = useParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(autoRetrySeconds);
  const [autoRetryStopped, setAutoRetryStopped] = useState(false);
  const notFound = !error;
  const { title, reason } = classify(error, notFound);

  useEffect(() => {
    if (autoRetryStopped || notFound) return;
    if (countdown <= 0) {
      onRetry();
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, autoRetryStopped, notFound, onRetry]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl shadow-sm p-8 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7 text-destructive" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground mb-1">{reason}</p>
        {params.domainName && (
          <p className="text-xs text-muted-foreground/70 font-mono mb-5 break-all">
            {decodeURIComponent(params.domainName)}
          </p>
        )}

        {!notFound && !autoRetryStopped && countdown > 0 && (
          <p className="text-xs text-muted-foreground mb-4">
            将在 <span className="font-semibold text-foreground">{countdown}s</span> 后自动重试…
            <button
              className="ml-2 underline hover:text-foreground"
              onClick={() => setAutoRetryStopped(true)}
            >
              取消
            </button>
          </p>
        )}

        <div className="flex flex-col gap-2">
          {!notFound && (
            <Button onClick={onRetry} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              立即重试
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate(-1)} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回上一页
          </Button>
          <Button variant="ghost" onClick={() => navigate('/')} className="w-full">
            <Home className="w-4 h-4 mr-2" />
            返回首页
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DomainDetailError;

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MailCheck, RefreshCw, AlertTriangle, MinusCircle, Copy } from 'lucide-react';

interface LogRow {
  id: string;
  recipient: string;
  subject: string;
  email_type: string;
  status: 'pending' | 'sent' | 'failed' | 'skipped' | 'duplicate';
  attempts: number;
  error: string | null;
  duration_ms: number | null;
  created_at: string;
  updated_at: string;
}

const STATUS_META: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
  sent: { label: '发送成功', variant: 'default', icon: MailCheck },
  failed: { label: '发送失败', variant: 'destructive', icon: AlertTriangle },
  pending: { label: '发送中', variant: 'secondary', icon: Loader2 },
  skipped: { label: '已按偏好跳过', variant: 'outline', icon: MinusCircle },
  duplicate: { label: '重复已拦截', variant: 'outline', icon: Copy },
};

const fmt = (s: string) => new Date(s).toLocaleString('zh-CN', { hour12: false });

export const EmailDeliveryStatus = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from('email_delivery_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    setRows((data || []) as LogRow[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`email-log-${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'email_delivery_log',
        filter: `user_id=eq.${user.id}`,
      }, () => { void load(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user, load]);

  const latest = rows[0];

  return (
    <div className="border rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium flex items-center gap-1.5">
          <MailCheck className="h-4 w-4" />最近一次邮件发送状态
        </p>
        <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading && rows.length === 0 ? (
        <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
      ) : !latest ? (
        <p className="text-xs text-muted-foreground">暂无邮件发送记录。当报价、订单或认证状态变化时会自动发送提醒邮件。</p>
      ) : (
        <>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={STATUS_META[latest.status]?.variant || 'outline'} className="text-xs">
                {STATUS_META[latest.status]?.label || latest.status}
              </Badge>
              <span className="text-xs text-muted-foreground">{fmt(latest.created_at)}</span>
              {latest.attempts > 1 && (
                <span className="text-xs text-muted-foreground">· 重试 {latest.attempts} 次</span>
              )}
            </div>
            <p className="text-sm truncate">{latest.subject}</p>
            <p className="text-xs text-muted-foreground truncate">收件人：{latest.recipient}</p>
            {latest.status === 'failed' && latest.error && (
              <p className="text-xs text-destructive break-all">失败原因：{latest.error}</p>
            )}
          </div>

          {rows.length > 1 && (
            <div className="pt-2 border-t space-y-1.5">
              <p className="text-[11px] text-muted-foreground">历史记录</p>
              {rows.slice(1).map(r => (
                <div key={r.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate flex-1">{r.subject}</span>
                  <Badge variant={STATUS_META[r.status]?.variant || 'outline'} className="text-[10px] shrink-0">
                    {STATUS_META[r.status]?.label || r.status}
                  </Badge>
                  <span className="text-muted-foreground shrink-0">{fmt(r.created_at).slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      <p className="text-[11px] text-muted-foreground">
        系统对同一事件的邮件会自动防重（10 分钟内不重复发送），失败时会自动重试 3 次（指数退避）。
      </p>
    </div>
  );
};

export default EmailDeliveryStatus;

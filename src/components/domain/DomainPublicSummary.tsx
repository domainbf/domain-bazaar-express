import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/currency';
import { toast } from 'sonner';
import { Link2, CalendarClock, Server, Globe, Gauge, Loader2 } from 'lucide-react';

interface DomainPublicSummaryProps {
  domainName: string;
  price: number;
  currency?: string | null;
  status?: string | null;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  available: { label: '可报价', className: 'bg-success/10 text-success border-success/30' },
  pending: { label: '暂不出售', className: 'bg-warning/10 text-warning border-warning/30' },
  reserved: { label: '保留中', className: 'bg-primary/10 text-primary border-primary/30' },
  sold: { label: '已售出 · 不可报价', className: 'bg-muted text-muted-foreground border-border' },
};

/** 公开可分享的域名摘要：报价状态、建议报价区间与 WHOIS 摘要 */
export const DomainPublicSummary = ({ domainName, price, currency, status }: DomainPublicSummaryProps) => {
  const [whois, setWhois] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!domainName) return;
    let cancelled = false;
    setLoading(true);
    supabase.functions
      .invoke('whois-query', { body: { domain: domainName } })
      .then(({ data }) => { if (!cancelled) setWhois(data?.success ? data.data : null); })
      .catch(() => { if (!cancelled) setWhois(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [domainName]);

  const st = STATUS_MAP[status || 'available'] || STATUS_MAP.available;
  const low = Math.round(price * 0.7);
  const high = Math.round(price * 0.95);

  const expiry = whois?.expiration_date || whois?.expiry_date || whois?.expires_at || null;
  const daysLeft = expiry ? Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000) : null;

  const copyLink = async () => {
    const url = `${window.location.origin}/domain/${domainName.toLowerCase()}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('公开详情页链接已复制');
    } catch {
      toast.error('复制失败，请手动复制地址栏链接');
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Badge variant="outline" className={st.className}>{st.label}</Badge>
        <Button variant="outline" size="sm" onClick={copyLink}>
          <Link2 className="w-3.5 h-3.5 mr-1.5" /> 复制分享链接
        </Button>
      </div>

      {status === 'available' && price > 0 && (
        <div className="rounded-lg bg-muted/40 border border-border/60 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <Gauge className="w-3.5 h-3.5" /> 建议报价区间
          </div>
          <div className="text-base font-semibold tabular-nums">
            {formatPrice(low, currency)} — {formatPrice(high, currency)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">基于挂牌价 {formatPrice(price, currency)} 估算，仅供参考。</p>
        </div>
      )}

      <div>
        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" /> WHOIS 摘要
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> 查询中...
          </div>
        ) : whois ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
            <div className="rounded-lg border border-border p-2.5">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1"><Server className="w-3 h-3" /> 注册商</div>
              <div className="font-medium truncate">{whois.registrar || '—'}</div>
            </div>
            <div className="rounded-lg border border-border p-2.5">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1"><CalendarClock className="w-3 h-3" /> 注册日期</div>
              <div className="font-medium truncate">
                {whois.creation_date ? new Date(whois.creation_date).toLocaleDateString('zh-CN') : '—'}
              </div>
            </div>
            <div className="rounded-lg border border-border p-2.5">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1"><CalendarClock className="w-3 h-3" /> 到期时间</div>
              <div className="font-medium truncate">
                {expiry ? new Date(expiry).toLocaleDateString('zh-CN') : '—'}
                {daysLeft !== null && daysLeft > 0 && (
                  <span className="text-[11px] text-muted-foreground ml-1">剩 {daysLeft} 天</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">暂无 WHOIS 数据</p>
        )}
      </div>
    </div>
  );
};

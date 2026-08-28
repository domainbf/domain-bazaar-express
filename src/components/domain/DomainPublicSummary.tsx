import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/currency';
import { toast } from 'sonner';
import { Link2, CalendarClock, Server, Globe, Gauge, Loader2, QrCode, Download, Share2 } from 'lucide-react';

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

  const expiry =
    whois?.expiryDate || whois?.expiration_date || whois?.expiry_date || whois?.expires_at || null;
  const created = whois?.createdDate || whois?.creation_date || whois?.created_at || null;
  const daysLeft = expiry ? Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000) : null;

  const shareUrl = useMemo(
    () => `${typeof window !== 'undefined' ? window.location.origin : ''}/domain/${domainName.toLowerCase()}`,
    [domainName],
  );
  const shareTitle = `${domainName.toUpperCase()} · 域名出售${price > 0 ? ` · ${formatPrice(price, currency)}` : ''}`;
  const shareDesc =
    status === 'sold'
      ? `${domainName.toUpperCase()} 已成交，浏览更多优质域名。`
      : `${domainName.toUpperCase()} 现可报价，建议区间 ${formatPrice(low, currency)} — ${formatPrice(high, currency)}，支持担保交易与安全过户。`;

  const [qr, setQr] = useState<string>('');
  useEffect(() => {
    QRCode.toDataURL(shareUrl, { width: 480, margin: 1, color: { dark: '#111111', light: '#ffffff' } })
      .then(setQr)
      .catch(() => setQr(''));
  }, [shareUrl]);

  useEffect(() => {
    const set = (kind: 'property' | 'name', key: string, val: string) => {
      let el = document.head.querySelector(`meta[${kind}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(kind, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', val);
    };
    set('property', 'og:title', shareTitle);
    set('property', 'og:description', shareDesc);
    set('property', 'og:url', shareUrl);
    set('property', 'og:type', 'website');
    set('name', 'twitter:title', shareTitle);
    set('name', 'twitter:description', shareDesc);
    set('name', 'twitter:card', 'summary_large_image');
  }, [shareTitle, shareDesc, shareUrl]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('公开详情页链接已复制');
    } catch {
      toast.error('复制失败，请手动复制地址栏链接');
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareDesc, url: shareUrl });
        return;
      } catch { /* cancelled */ }
    }
    copyLink();
  };

  const downloadQr = () => {
    if (!qr) return;
    const a = document.createElement('a');
    a.href = qr;
    a.download = `${domainName.toLowerCase()}-qrcode.png`;
    a.click();
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Badge variant="outline" className={st.className}>{st.label}</Badge>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyLink}>
            <Link2 className="w-3.5 h-3.5 mr-1.5" /> 复制链接
          </Button>
          <Button size="sm" onClick={nativeShare}>
            <Share2 className="w-3.5 h-3.5 mr-1.5" /> 分享
          </Button>
        </div>
      </div>

      {/* 分享预览 + 二维码 */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="flex items-stretch gap-3 p-3">
          <div className="shrink-0 w-24 h-24 rounded-md border border-border bg-background flex items-center justify-center p-1.5">
            {qr ? (
              <img src={qr} alt={`${domainName} 分享二维码`} className="w-full h-full object-contain" loading="lazy" />
            ) : (
              <QrCode className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">分享预览</div>
            <div className="text-sm font-semibold truncate mt-0.5">{shareTitle}</div>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{shareDesc}</p>
            <div className="text-[11px] text-muted-foreground truncate mt-1">{shareUrl}</div>
            <Button variant="ghost" size="sm" className="h-6 px-2 mt-1 text-[11px]" onClick={downloadQr} disabled={!qr}>
              <Download className="w-3 h-3 mr-1" /> 下载二维码
            </Button>
          </div>
        </div>
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

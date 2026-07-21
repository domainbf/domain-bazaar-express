import { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/currency';
import { getDomainDetailPath } from '@/lib/domainRouting';
import { DomainOfferForm } from './DomainOfferForm';
import { Loader2, History, ArrowRight, Tag, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';


interface OfferRow {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  domain: string;
  domainId?: string;
  sellerId?: string;
  price?: number;
  currency?: string;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function DomainQuickViewDialog({ open, onClose, domain, domainId, sellerId, price, currency = 'CNY', onPrev, onNext, hasPrev, hasNext }: Props) {

  const { user } = useAuth();
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadOffers = useCallback(async () => {
    if (!domainId) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from('domain_offers')
      .select('id, amount, currency, status, created_at')
      .eq('domain_id', domainId)
      .order('amount', { ascending: false })
      .limit(10);
    setOffers(data || []);
    setLoading(false);
  }, [domainId]);

  useEffect(() => {
    if (!open || !domainId) return;
    loadOffers();
    // 实时订阅报价变化
    const channel = (supabase as any)
      .channel(`offers-${domainId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'domain_offers', filter: `domain_id=eq.${domainId}` }, () => {
        loadOffers();
      })
      .subscribe();
    return () => { (supabase as any).removeChannel(channel); };
  }, [open, domainId, loadOffers]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(domain);
      setCopied(true);
      toast.success(`已复制 ${domain}`);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('复制失败');
    }
  };

  const minOffer = price ? Math.round(price * 0.3) : null;
  const highest = offers[0];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && (onClose(), setShowOfferForm(false))}>
      <DialogContent className="bg-background border-border max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase tracking-tight text-center break-all">
            {domain}
          </DialogTitle>
          <div className="flex justify-center pt-1">
            <Button type="button" variant="outline" size="sm" onClick={handleCopy} className="h-7 gap-1.5 text-xs">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? '已复制' : '复制域名'}
            </Button>
          </div>
        </DialogHeader>

        {showOfferForm ? (
          <DomainOfferForm
            domain={domain}
            domainId={domainId}
            sellerId={sellerId}
            initialCurrency={currency}
            listingPrice={price}
            listingCurrency={currency}
            onSubmitted={loadOffers}
            onClose={() => { setShowOfferForm(false); onClose(); }}
            isAuthenticated={!!user}
          />
        ) : (
          <div className="space-y-4 mt-2">
            {/* Price block */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-border p-3 text-center">
                <div className="text-[10px] uppercase text-muted-foreground tracking-wider">挂牌价</div>
                <div className="text-lg font-bold tabular-nums mt-1">
                  {price ? formatPrice(price, currency) : '面议'}
                </div>
              </div>
              <div className="rounded-lg border border-border p-3 text-center">
                <div className="text-[10px] uppercase text-muted-foreground tracking-wider flex items-center gap-1 justify-center">
                  <Tag className="w-3 h-3" />建议最低
                </div>
                <div className="text-lg font-bold tabular-nums mt-1">
                  {minOffer ? formatPrice(minOffer, currency) : '—'}
                </div>
              </div>
            </div>

            {/* Offer history */}
            <div className="rounded-lg border border-border">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                <History className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">报价历史</span>
                {highest && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    最高：<span className="font-bold text-foreground tabular-nums">{formatPrice(highest.amount, highest.currency)}</span>
                  </span>
                )}
              </div>
              <div className="max-h-44 overflow-y-auto divide-y divide-border">
                {loading ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
                ) : offers.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground py-6">暂无报价，成为第一个报价者</div>
                ) : (
                  offers.map((o, i) => (
                    <div key={o.id} className="flex items-center justify-between px-3 py-2 text-xs">
                      <span className="text-muted-foreground">#{i + 1} · {new Date(o.created_at).toLocaleDateString('zh-CN')}</span>
                      <span className="font-bold tabular-nums text-foreground">{formatPrice(o.amount, o.currency)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setShowOfferForm(true)}
                className="w-full bg-foreground text-background hover:bg-foreground/90"
              >
                提交报价
              </Button>
              <Link to={getDomainDetailPath(domain)} onClick={onClose}>
                <Button variant="outline" className="w-full gap-1">
                  详情 <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

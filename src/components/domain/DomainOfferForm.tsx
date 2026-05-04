import { useState, useRef, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Mail, Send, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { CURRENCIES, formatPrice, getCurrencySymbol } from '@/lib/currency';

interface DomainOfferFormProps {
  domain: string;
  domainId?: string;
  sellerId?: string;
  onClose: () => void;
  isAuthenticated: boolean;
  initialOffer?: number;
  initialCurrency?: string;
  isBuyNow?: boolean;
}

export const DomainOfferForm = ({
  domain,
  domainId,
  sellerId,
  onClose,
  isAuthenticated,
  initialOffer,
  initialCurrency = 'CNY',
  isBuyNow = false,
}: DomainOfferFormProps) => {
  const { session } = useAuth();
  const [offer, setOffer] = useState(initialOffer ? String(initialOffer) : '');
  const [currency, setCurrency] = useState((initialCurrency || 'CNY').toUpperCase());
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);

  const numericOffer = useMemo(() => {
    const n = parseFloat(offer);
    return isFinite(n) && n > 0 ? n : null;
  }, [offer]);

  const previewText = numericOffer != null ? formatPrice(numericOffer, currency) : null;
  const symbol = getCurrencySymbol(currency);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!captchaToken) { setError('请完成人机验证'); toast.error('请完成人机验证'); return; }
    if (!numericOffer) { setError('请输入有效的报价金额'); toast.error('请输入有效的报价金额'); return; }
    if (!email || !email.includes('@')) { setError('请输入有效的邮箱地址'); toast.error('请输入有效的邮箱地址'); return; }

    setIsLoading(true);

    try {
      let domainInfo = { domainId, sellerId };

      if (!domainId || !sellerId) {
        const { data: domainData, error: domainError } = await supabase
          .from('domain_listings')
          .select('id, owner_id')
          .ilike('name', domain)
          .maybeSingle();
        if (domainError) throw new Error('查询域名信息时出错，请稍后重试');
        if (!domainData) throw new Error('未找到该域名信息，请确认域名是否正确');
        domainInfo = { domainId: domainData.id, sellerId: domainData.owner_id };
      }

      if (!domainInfo.domainId || !domainInfo.sellerId) {
        throw new Error('域名信息不完整，无法提交报价');
      }

      const { error: insertError } = await supabase
        .from('domain_offers')
        .insert({
          domain_id: domainInfo.domainId,
          seller_id: domainInfo.sellerId,
          buyer_id: session?.user?.id || null,
          amount: numericOffer,
          currency,
          contact_email: email,
          message: message || '',
          status: 'pending',
        } as any);

      if (insertError) throw new Error(insertError.message);

      // 邮件通知（含币种与符号）
      supabase.functions.invoke('send-offer', {
        body: {
          domain,
          domainId: domainInfo.domainId,
          offer: numericOffer,
          currency,
          currencySymbol: symbol,
          formattedOffer: formatPrice(numericOffer, currency),
          email,
          message,
          buyerId: session?.user?.id || null,
        },
      }).catch(err => console.warn('Offer email notification failed:', err));

      toast.success('您的报价已成功提交！');
      setOffer(''); setEmail(''); setMessage(''); setCaptchaToken(null);
      captchaRef.current?.resetCaptcha();
      onClose();
    } catch (err: any) {
      const msg = err.message || '提交报价失败，请稍后重试';
      setError(msg); toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      {!isAuthenticated && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-md mb-4">
          <p className="text-yellow-700 dark:text-yellow-400 text-sm">
            您尚未登录。您的报价仍会发送给卖家，但创建账户可以让您跟踪报价状态。
          </p>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 p-3 rounded-md mb-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-destructive mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {isBuyNow ? '购买金额（标价）' : '您的报价'}
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{symbol}</span>
            <Input
              type="number"
              placeholder="1000"
              value={offer}
              onChange={(e) => { if (!isBuyNow) { setOffer(e.target.value); setError(null); } }}
              readOnly={isBuyNow}
              required
              min="1"
              step="any"
              className={`pl-8 ${isBuyNow ? 'bg-muted cursor-default' : ''}`}
            />
          </div>
          <Select value={currency} onValueChange={(v) => !isBuyNow && setCurrency(v)} disabled={isBuyNow}>
            <SelectTrigger className="w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map(c => (
                <SelectItem key={c.code} value={c.code}>
                  {c.code} {c.symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 价格预览 — 防止用户混淆币种 */}
        <div className="rounded-md bg-muted/40 border border-border px-3 py-2 text-xs text-muted-foreground">
          {previewText ? (
            <span>提交后金额将记录为：<span className="font-semibold text-foreground tabular-nums">{previewText} {currency}</span></span>
          ) : (
            <span>请输入报价金额，将以 <span className="font-semibold text-foreground">{currency}</span> 提交</span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">联系邮箱</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            required
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">留言（可选）</label>
        <textarea
          placeholder="添加关于您报价的任何详细信息..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full bg-background border border-input rounded-md p-2 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          rows={3}
        />
      </div>

      <div className="my-4 flex justify-center">
        <HCaptcha
          sitekey="10000000-ffff-ffff-ffff-000000000001"
          onVerify={(token) => { setCaptchaToken(token); setError(null); }}
          onError={() => { setCaptchaToken(null); setError('人机验证失败，请重试'); }}
          ref={captchaRef}
          size="normal"
        />
      </div>

      <Button type="submit" disabled={isLoading || !captchaToken} className="w-full">
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
            提交中...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            {captchaToken ? (
              <>
                <Send className="w-4 h-4" />
                {isBuyNow ? '确认购买' : '提交报价'}{previewText ? ` · ${previewText}` : ''}
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                请完成人机验证
              </>
            )}
          </span>
        )}
      </Button>
    </form>
  );
};

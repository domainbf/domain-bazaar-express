import { useState, useRef, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Mail, Send, Loader2, ShieldCheck, AlertCircle, CheckCircle2, Clock, MailCheck } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { CURRENCIES, formatPrice, getCurrencySymbol, convertCurrency } from '@/lib/currency';

interface DomainOfferFormProps {
  domain: string;
  domainId?: string;
  sellerId?: string;
  onClose: () => void;
  isAuthenticated: boolean;
  initialOffer?: number;
  initialCurrency?: string;
  isBuyNow?: boolean;
  /** 卖家在 listing 中设定的价格（用于换算到 CNY 后判断最低/最高） */
  listingPrice?: number;
  listingCurrency?: string;
  onSubmitted?: () => void;
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
  listingPrice,
  listingCurrency = 'CNY',
  onSubmitted,
}: DomainOfferFormProps) => {
  const { session } = useAuth();
  const [offer, setOffer] = useState(initialOffer ? String(initialOffer) : '');
  const [currency, setCurrency] = useState((initialCurrency || 'CNY').toUpperCase());
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; type: 'network' | 'duplicate' | 'email_failed' | 'db_error' | 'validation' | 'unknown'; reason?: string } | null>(null);
  const [submitState, setSubmitState] = useState<{ status: 'submitted' | 'reviewing' | 'emailed'; amount: number; currency: string } | null>(null);
  const [showReason, setShowReason] = useState(false);
  const captchaRef = useRef<HCaptcha>(null);
  const inflightRef = useRef<string | null>(null);
  const submittedKeysRef = useRef<Set<string>>(new Set());

  const numericOffer = useMemo(() => {
    const n = parseFloat(offer);
    return isFinite(n) && n > 0 ? n : null;
  }, [offer]);

  const previewText = numericOffer != null ? formatPrice(numericOffer, currency) : null;
  const symbol = getCurrencySymbol(currency);

  // 最低 / 最高（以挂牌币种为基准），最低=挂牌价的 30%，最高=挂牌价的 5 倍
  const limits = useMemo(() => {
    if (!listingPrice || listingPrice <= 0) return null;
    const minInListing = listingPrice * 0.3;
    const maxInListing = listingPrice * 5;
    return {
      min: convertCurrency(minInListing, listingCurrency, currency),
      max: convertCurrency(maxInListing, listingCurrency, currency),
    };
  }, [listingPrice, listingCurrency, currency]);

  // 换算到挂牌币种的预览
  const convertedPreview = useMemo(() => {
    if (numericOffer == null) return null;
    if (currency === listingCurrency.toUpperCase()) return null;
    const v = convertCurrency(numericOffer, currency, listingCurrency);
    return formatPrice(v, listingCurrency);
  }, [numericOffer, currency, listingCurrency]);

  const rangeError = useMemo(() => {
    if (!numericOffer || !limits) return null;
    if (numericOffer < limits.min) return `报价过低，建议不低于 ${formatPrice(limits.min, currency)}`;
    if (numericOffer > limits.max) return `报价过高，建议不超过 ${formatPrice(limits.max, currency)}`;
    return null;
  }, [numericOffer, limits, currency]);

  const setErr = (message: string, type: typeof error extends { type: infer T } ? T : never = 'unknown' as any, reason?: string) => {
    setError({ message, type: type as any, reason });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowReason(false);

    if (isLoading || inflightRef.current) return;

    if (!captchaToken) { setErr('请完成人机验证', 'validation'); toast.error('请完成人机验证'); return; }
    if (!numericOffer) { setErr('请输入有效的报价金额', 'validation'); toast.error('请输入有效的报价金额'); return; }
    if (!isBuyNow && rangeError) { setErr(rangeError, 'validation'); toast.error(rangeError); return; }
    if (!email || !email.includes('@')) { setErr('请输入有效的邮箱地址', 'validation'); toast.error('请输入有效的邮箱地址'); return; }

    const idemKey = `${domain}|${(session?.user?.id || email).toLowerCase()}|${numericOffer}|${currency}`;
    if (submittedKeysRef.current.has(idemKey)) {
      setErr('该报价已提交，无需重复提交', 'duplicate', '本次会话已成功提交过相同金额的报价');
      toast.info('该报价已提交');
      return;
    }
    inflightRef.current = idemKey;
    setIsLoading(true);

    try {
      let domainInfo = { domainId, sellerId };
      if (!domainId || !sellerId) {
        const { data: domainData, error: domainError } = await supabase
          .from('domain_listings').select('id, owner_id').ilike('name', domain).maybeSingle();
        if (domainError) throw Object.assign(new Error('查询域名信息时出错，请稍后重试'), { errType: 'network' });
        if (!domainData) throw Object.assign(new Error('未找到该域名信息，请确认域名是否正确'), { errType: 'validation' });
        domainInfo = { domainId: domainData.id, sellerId: domainData.owner_id };
      }
      if (!domainInfo.domainId || !domainInfo.sellerId) {
        throw Object.assign(new Error('域名信息不完整，无法提交报价'), { errType: 'validation' });
      }

      setSubmitState({ status: 'submitted', amount: numericOffer, currency });
      onSubmitted?.();
      setSubmitState({ status: 'reviewing', amount: numericOffer, currency });

      const { data: invokeData, error: invokeError } = await supabase.functions.invoke('send-offer', {
        body: {
          domain, domainId: domainInfo.domainId, sellerId: domainInfo.sellerId,
          offer: numericOffer, currency, currencySymbol: symbol,
          formattedOffer: formatPrice(numericOffer, currency),
          email, message,
          buyerId: session?.user?.id || null,
          captchaToken, idempotencyKey: idemKey,
        },
      });

      if (invokeError) {
        throw Object.assign(new Error(invokeError.message || '网络异常，请检查网络后重试'), { errType: 'network' });
      }
      if (invokeData && (invokeData as any).success === false) {
        const remoteType = (invokeData as any).errorType;
        throw Object.assign(
          new Error((invokeData as any).error || '提交失败，请稍后重试'),
          { errType: remoteType || 'unknown', rolledBack: (invokeData as any).rolledBack }
        );
      }

      submittedKeysRef.current.add(idemKey);

      if ((invokeData as any)?.duplicate) {
        toast.info('已检测到相同金额的报价，已自动归并');
      } else {
        toast.success('您的报价已成功提交！');
      }

      setSubmitState({ status: 'emailed', amount: numericOffer, currency });
      setOffer(''); setMessage(''); setCaptchaToken(null);
      captchaRef.current?.resetCaptcha();
    } catch (err: any) {
      const type = err?.errType || 'unknown';
      const msg = err?.message || '提交报价失败，请稍后重试';
      const reason = type === 'email_failed'
        ? '邮件网关返回失败，系统已自动回滚数据库记录，您可立即重新提交'
        : type === 'network'
        ? '网络或服务暂时不可用，请检查连接后重试'
        : type === 'db_error'
        ? '数据库写入失败，未发送邮件，您可重新提交'
        : type === 'duplicate'
        ? '5 分钟内已存在相同金额的报价，已自动归并'
        : undefined;
      setError({ message: msg, type, reason });
      toast.error(msg);
      setSubmitState(null);
      setCaptchaToken(null);
      captchaRef.current?.resetCaptcha();
    } finally {
      inflightRef.current = null;
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

      {submitState && (
        <div className="rounded-md border border-border bg-muted/40 p-3 space-y-2 mb-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">报价状态</div>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2 text-foreground">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>已提交 · <span className="tabular-nums font-semibold">{formatPrice(submitState.amount, submitState.currency)}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${submitState.status !== 'submitted' ? 'text-emerald-500' : 'text-muted-foreground animate-pulse'}`} />
              <span className={submitState.status !== 'submitted' ? 'text-foreground' : 'text-muted-foreground'}>
                待卖家审核
              </span>
            </div>
            <div className="flex items-center gap-2">
              {submitState.status === 'emailed' ? (
                <><MailCheck className="w-4 h-4 text-emerald-500" /><span className="text-foreground">邮件通知已发送</span></>
              ) : (
                <><Mail className="w-4 h-4 text-muted-foreground animate-pulse" /><span className="text-muted-foreground">正在发送邮件通知…</span></>
              )}
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" className="w-full" onClick={onClose}>
            完成
          </Button>
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
        <div className={`rounded-md border px-3 py-2 text-xs space-y-1 ${
          rangeError ? 'bg-destructive/10 border-destructive/30 text-destructive' : 'bg-muted/40 border-border text-muted-foreground'
        }`}>
          {previewText ? (
            <div>提交后金额将记录为：<span className="font-semibold text-foreground tabular-nums">{previewText} {currency}</span>
              {convertedPreview && (
                <span className="ml-2 text-muted-foreground">≈ <span className="font-semibold text-foreground tabular-nums">{convertedPreview}</span></span>
              )}
            </div>
          ) : (
            <div>请输入报价金额，将以 <span className="font-semibold text-foreground">{currency}</span> 提交</div>
          )}
          {limits && !isBuyNow && (
            <div className="text-[11px]">
              建议范围：<span className="tabular-nums">{formatPrice(limits.min, currency)}</span> – <span className="tabular-nums">{formatPrice(limits.max, currency)}</span>
            </div>
          )}
          {rangeError && <div className="font-medium">{rangeError}</div>}
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

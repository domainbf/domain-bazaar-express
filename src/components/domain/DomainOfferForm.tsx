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
import { useTranslation } from 'react-i18next';


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
  const { t } = useTranslation();
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
  // 提交节流：两次提交之间至少间隔 15 秒，防止误触与刷单
  const COOLDOWN_SEC = 15;
  const lastSubmitRef = useRef<number>(0);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

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
    if (numericOffer < limits.min) return t('offer.form.rangeLow', { min: formatPrice(limits.min, currency) });
    if (numericOffer > limits.max) return t('offer.form.rangeHigh', { max: formatPrice(limits.max, currency) });
    return null;
  }, [numericOffer, limits, currency, t]);


  const setErr = (message: string, type: typeof error extends { type: infer T } ? T : never = 'unknown' as any, reason?: string) => {
    setError({ message, type: type as any, reason });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowReason(false);

    if (isLoading || inflightRef.current) return;

    if (!captchaToken) { setErr(t('offer.form.captchaHint'), 'validation'); toast.error(t('offer.form.captchaHint')); return; }
    if (!numericOffer) { setErr(t('offer.form.invalidAmount'), 'validation'); toast.error(t('offer.form.invalidAmount')); return; }
    if (!isBuyNow && rangeError) { setErr(rangeError, 'validation'); toast.error(rangeError); return; }
    if (!email || !email.includes('@')) { setErr(t('offer.form.emailInvalid'), 'validation'); toast.error(t('offer.form.emailInvalid')); return; }

    const idemKey = `${domain}|${(session?.user?.id || email).toLowerCase()}|${numericOffer}|${currency}`;
    if (submittedKeysRef.current.has(idemKey)) {
      setErr(t('offer.form.duplicateSubmitted'), 'duplicate', t('offer.form.duplicateReason'));
      toast.info(t('offer.form.duplicateToast'));
      return;
    }

    inflightRef.current = idemKey;
    setIsLoading(true);

    try {
      let domainInfo = { domainId, sellerId };
      if (!domainId || !sellerId) {
        const { data: domainData, error: domainError } = await supabase
          .from('domain_listings').select('id, owner_id').ilike('name', domain).maybeSingle();
        if (domainError) throw Object.assign(new Error(t('offer.form.lookupError')), { errType: 'network' });
        if (!domainData) throw Object.assign(new Error(t('offer.form.domainNotFound')), { errType: 'validation' });
        domainInfo = { domainId: domainData.id, sellerId: domainData.owner_id };
      }
      if (!domainInfo.domainId || !domainInfo.sellerId) {
        throw Object.assign(new Error(t('offer.form.domainIncomplete')), { errType: 'validation' });
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
        throw Object.assign(new Error(invokeError.message || t('offer.form.networkError')), { errType: 'network' });
      }
      if (invokeData && (invokeData as any).success === false) {
        const remoteType = (invokeData as any).errorType;
        throw Object.assign(
          new Error((invokeData as any).error || t('offer.form.submitFailed')),
          { errType: remoteType || 'unknown', rolledBack: (invokeData as any).rolledBack }
        );
      }

      submittedKeysRef.current.add(idemKey);

      if ((invokeData as any)?.duplicate) {
        toast.info(t('offer.form.autoMerged'));
      } else {
        toast.success(t('offer.form.submitSuccess'));
      }

      setSubmitState({ status: 'emailed', amount: numericOffer, currency });
      setOffer(''); setMessage(''); setCaptchaToken(null);
      captchaRef.current?.resetCaptcha();
    } catch (err: any) {
      const type = err?.errType || 'unknown';
      const msg = err?.message || t('offer.form.submitGenericFail');
      const reason = type === 'email_failed'
        ? t('offer.form.reasons.emailFailed')
        : type === 'network'
        ? t('offer.form.reasons.network')
        : type === 'db_error'
        ? t('offer.form.reasons.dbError')
        : type === 'duplicate'
        ? t('offer.form.reasons.duplicate')
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
            {t('offer.form.guestNotice')}
          </p>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 p-3 rounded-md mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-destructive/20 text-destructive font-semibold">
                  {error.type === 'network' ? t('offer.form.errorTypes.network') :
                   error.type === 'duplicate' ? t('offer.form.errorTypes.duplicate') :
                   error.type === 'email_failed' ? t('offer.form.errorTypes.emailFailed') :
                   error.type === 'db_error' ? t('offer.form.errorTypes.dbError') :
                   error.type === 'validation' ? t('offer.form.errorTypes.validation') : t('offer.form.errorTypes.unknown')}
                </span>
              </div>
              <p className="text-destructive text-sm">{error.message}</p>
              {showReason && error.reason && (
                <p className="text-xs text-muted-foreground mt-2 p-2 bg-background rounded border border-border">{error.reason}</p>
              )}
              <div className="flex gap-2 mt-2">
                {error.reason && (
                  <button type="button" onClick={() => setShowReason(v => !v)}
                    className="text-xs text-destructive underline hover:no-underline">
                    {showReason ? t('offer.form.hideReason') : t('offer.form.showReason')}
                  </button>
                )}
                {(error.type === 'network' || error.type === 'email_failed' || error.type === 'db_error') && (
                  <button type="button" onClick={() => { setError(null); }}
                    className="text-xs text-destructive underline hover:no-underline">
                    {t('offer.form.resubmit')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {submitState && (
        <div className="rounded-md border border-border bg-muted/40 p-3 space-y-2 mb-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('offer.form.statusHeading')}</div>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2 text-foreground">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{t('offer.form.submitted')} · <span className="tabular-nums font-semibold">{formatPrice(submitState.amount, submitState.currency)}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${submitState.status !== 'submitted' ? 'text-emerald-500' : 'text-muted-foreground animate-pulse'}`} />
              <span className={submitState.status !== 'submitted' ? 'text-foreground' : 'text-muted-foreground'}>
                {t('offer.form.awaitingReview')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {submitState.status === 'emailed' ? (
                <><MailCheck className="w-4 h-4 text-emerald-500" /><span className="text-foreground">{t('offer.form.emailSent')}</span></>
              ) : (
                <><Mail className="w-4 h-4 text-muted-foreground animate-pulse" /><span className="text-muted-foreground">{t('offer.form.emailSending')}</span></>
              )}
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" className="w-full" onClick={onClose}>
            {t('offer.form.done')}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {isBuyNow ? t('offer.form.buyAmountLabel') : t('offer.form.amountLabel')}
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{symbol}</span>
            <Input
              type="number"
              inputMode="decimal"
              placeholder={t('offer.form.amountPlaceholder')}
              value={offer}
              onChange={(e) => { if (!isBuyNow) { setOffer(e.target.value); setError(null); } }}
              readOnly={isBuyNow}
              required
              min="1"
              step="any"
              className={`pl-8 h-11 text-base ${isBuyNow ? 'bg-muted cursor-default' : ''}`}
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

        {/* 快速金额芯片：基于挂牌价的百分比，移动端一键填入 */}
        {!isBuyNow && listingPrice && listingPrice > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[0.5, 0.7, 0.85, 1].map((pct) => {
              const amountInListing = listingPrice * pct;
              const amountInCurrent = convertCurrency(amountInListing, listingCurrency, currency);
              const rounded = Math.round(amountInCurrent);
              return (
                <button
                  key={pct}
                  type="button"
                  onClick={() => { setOffer(String(rounded)); setError(null); }}
                  className="px-2.5 py-1 text-xs rounded-full border border-border bg-background hover:bg-accent transition-colors tabular-nums"
                >
                  {Math.round(pct * 100)}% · {formatPrice(rounded, currency)}
                </button>
              );
            })}
          </div>
        )}

        {/* 价格预览 — 防止用户混淆币种 */}
        <div className={`rounded-md border px-3 py-2 text-xs space-y-1 ${
          rangeError ? 'bg-destructive/10 border-destructive/30 text-destructive' : 'bg-muted/40 border-border text-muted-foreground'
        }`}>
          {previewText ? (
            <div>{t('offer.form.recordedAs')}<span className="font-semibold text-foreground tabular-nums">{previewText} {currency}</span>
              {convertedPreview && (
                <span className="ml-2 text-muted-foreground">{t('offer.form.approx')} <span className="font-semibold text-foreground tabular-nums">{convertedPreview}</span></span>
              )}
            </div>
          ) : (
            <div>{t('offer.form.pleaseEnter', { code: currency })}</div>
          )}
          {limits && !isBuyNow && (
            <div className="text-[11px]">
              {t('offer.form.suggestedRange', { min: formatPrice(limits.min, currency), max: formatPrice(limits.max, currency) })}
            </div>
          )}
          {rangeError && <div className="font-medium">{rangeError}</div>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{t('offer.form.emailLabel')}</label>
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
        <label className="text-sm font-medium text-foreground">{t('offer.form.messageLabel')}</label>
        <textarea
          placeholder={t('offer.form.messagePlaceholder')}
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
          onError={() => { setCaptchaToken(null); setErr(t('offer.form.captchaFailed'), 'validation'); }}
          ref={captchaRef}
          size="normal"
        />
      </div>

      <Button type="submit" disabled={isLoading || !captchaToken} className="w-full">
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
            {t('offer.form.submitting')}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            {captchaToken ? (
              <>
                <Send className="w-4 h-4" />
                {isBuyNow ? t('offer.form.buyBtn') : t('offer.form.submitBtn')}{previewText ? ` · ${previewText}` : ''}
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                {t('offer.form.captchaHint')}
              </>
            )}
          </span>
        )}
      </Button>
    </form>
  );
};

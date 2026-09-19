import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/currency';
import { Copy, ExternalLink, Shield } from 'lucide-react';

interface GatewayRow {
  gateway_name: string;
  display_name: string;
  fee_rate: number | null;
  config: Record<string, any> | null;
  min_amount: number | null;
  max_amount: number | null;
}

export interface PayOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  amount: number;
  currency?: string;
  domainName?: string;
}

/** 真实支付入口：读取后台启用的支付通道，金额与订单严格绑定（服务端校验） */
export const PayOrderDialog = ({ open, onOpenChange, orderId, amount, currency = 'CNY', domainName }: PayOrderDialogProps) => {
  const [gateways, setGateways] = useState<GatewayRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState<string | null>(null);
  const [manual, setManual] = useState<{ gateway: string; info: Record<string, any> } | null>(null);

  useEffect(() => {
    if (!open) { setManual(null); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await (supabase as any)
        .from('payment_gateway_settings')
        .select('gateway_name, display_name, fee_rate, config, min_amount, max_amount')
        .eq('is_enabled', true);
      if (cancelled) return;
      if (error) toast.error('支付方式加载失败，请稍后再试');
      setGateways((data ?? []) as GatewayRow[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('已复制');
  };

  const pay = async (gateway: string) => {
    setPaying(gateway);
    try {
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: { order_id: orderId, gateway, return_url: `${window.location.origin}/order/${orderId}` },
      });
      if (error) throw new Error(error.message);
      const res = data as any;
      if (!res?.success) throw new Error(res?.error || '支付创建失败');

      if (res.payment_url) {
        window.location.href = res.payment_url as string;
        return;
      }
      // 线下 / 链上通道：展示收款信息，回调确认后订单自动成交
      setManual({ gateway, info: res.payment_info || res.instructions || res });
    } catch (e: any) {
      toast.error(e.message || '支付发起失败');
    } finally {
      setPaying(null);
    }
  };

  const feeText = (g: GatewayRow) =>
    g.fee_rate && Number(g.fee_rate) > 0 ? `手续费 ${(Number(g.fee_rate) * 100).toFixed(2)}%` : '免手续费';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>订单付款</DialogTitle>
          <DialogDescription>
            {domainName ? `${domainName} · ` : ''}应付 {formatPrice(amount, currency)}
          </DialogDescription>
        </DialogHeader>

        {manual ? (
          <div className="space-y-3">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>请按以下信息完成付款，到账确认后订单将自动变为成交。</AlertDescription>
            </Alert>
            <div className="space-y-2 rounded-lg border p-3 text-sm">
              {Object.entries(manual.info)
                .filter(([, v]) => typeof v === 'string' || typeof v === 'number')
                .map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="flex items-center gap-1 font-mono text-xs break-all">
                      {String(v)}
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copy(String(v))}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </span>
                  </div>
                ))}
            </div>
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>我已完成付款</Button>
          </div>
        ) : loading ? (
          <div className="py-10 text-center"><LoadingSpinner size="lg" /></div>
        ) : gateways.length === 0 ? (
          <Alert>
            <AlertDescription>当前没有启用的支付方式，请联系客服完成付款。</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-2">
              {gateways.map((g) => (
                <button
                  key={g.gateway_name}
                  onClick={() => pay(g.gateway_name)}
                  disabled={!!paying}
                  data-testid={`button-pay-${g.gateway_name}`}
                  className="flex items-center justify-between gap-3 rounded-lg border-2 border-border p-4 text-left transition-colors hover:border-primary hover:bg-muted/40 disabled:opacity-60"
                >
                  <div className="min-w-0">
                    <div className="font-medium">{g.display_name || g.gateway_name}</div>
                    <div className="text-xs text-muted-foreground">{feeText(g)}</div>
                  </div>
                  {paying === g.gateway_name
                    ? <LoadingSpinner size="sm" />
                    : <ExternalLink className="h-4 w-4 text-muted-foreground" />}
                </button>
              ))}
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">
              付款金额由系统按订单核定，支付成功后订单自动成交，卖家信誉分实时更新。
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

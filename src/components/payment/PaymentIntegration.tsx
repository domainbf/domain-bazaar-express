import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  CreditCard, Smartphone, Banknote, Shield, CheckCircle, Clock, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { Domain } from '@/types/domain';
import { supabase } from '@/integrations/supabase/client';

interface PaymentIntegrationProps {
  domain: Domain;
  onPaymentSuccess: () => void;
  onClose: () => void;
}

interface GatewayOption {
  gateway_name: string;
  display_name: string;
  fee_rate: number;
  is_enabled: boolean;
}

const gatewayIcons: Record<string, any> = {
  alipay: Smartphone,
  wechat_pay: Smartphone,
  paypal: CreditCard,
  stripe: CreditCard,
  bank_transfer: Banknote,
};

export const PaymentIntegration: React.FC<PaymentIntegrationProps> = ({
  domain, onPaymentSuccess, onClose
}) => {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [gateways, setGateways] = useState<GatewayOption[]>([]);
  const [loadingGateways, setLoadingGateways] = useState(true);
  const [bankInfo, setBankInfo] = useState<any>(null);

  useEffect(() => {
    loadEnabledGateways();
  }, []);

  const loadEnabledGateways = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_gateway_settings')
        .select('gateway_name, display_name, fee_rate, is_enabled')
        .eq('is_enabled', true);
      if (error) throw error;
      setGateways((data || []).map(g => ({ ...g, fee_rate: Number(g.fee_rate) || 0 })));
    } catch (error) {
      console.error('Failed to load gateways:', error);
      toast.error('加载支付方式失败');
    } finally {
      setLoadingGateways(false);
    }
  };

  const selectedGateway = gateways.find(g => g.gateway_name === paymentMethod);
  const fee = selectedGateway ? domain.price * selectedGateway.fee_rate : 0;
  const total = domain.price + fee;

  const handlePayment = async () => {
    if (!paymentMethod) {
      toast.error('请选择支付方式');
      return;
    }
    setIsProcessing(true);
    setBankInfo(null);

    try {
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          gateway: paymentMethod,
          amount: domain.price,
          currency: domain.currency || 'CNY',
          domain_id: domain.id,
          domain_name: domain.name,
          return_url: window.location.href,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || '支付创建失败');

      if (paymentMethod === 'bank_transfer') {
        setBankInfo(data.gateway_response);
        toast.success('请按照以下信息完成银行转账');
      } else if (data.payment_url) {
        toast.success('正在跳转到支付页面...');
        window.open(data.payment_url, '_blank');
        onPaymentSuccess();
      } else {
        toast.success('支付订单已创建，请在支付平台完成付款');
        onPaymentSuccess();
      }
    } catch (error: any) {
      console.error('Payment failed:', error);
      toast.error(error.message || '支付失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>支付 {domain.name}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Order summary */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">订单摘要</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>域名价格</span>
                <span>¥{domain.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>手续费</span>
                <span>¥{fee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>总计</span>
                <span>¥{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment methods */}
          {loadingGateways ? (
            <div className="text-center py-8 text-muted-foreground">加载支付方式中...</div>
          ) : gateways.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无可用支付方式，请联系管理员配置
            </div>
          ) : (
            <div>
              <Label className="text-base font-semibold mb-3 block">选择支付方式</Label>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="grid grid-cols-1 gap-3">
                  {gateways.map((gw) => {
                    const Icon = gatewayIcons[gw.gateway_name] || CreditCard;
                    const feeText = gw.fee_rate > 0 ? `${(gw.fee_rate * 100).toFixed(1)}%` : '免费';
                    return (
                      <div key={gw.gateway_name} className="flex items-center space-x-2">
                        <RadioGroupItem value={gw.gateway_name} id={gw.gateway_name} />
                        <Label
                          htmlFor={gw.gateway_name}
                          className="flex-1 cursor-pointer p-3 border rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Icon className="h-5 w-5" />
                              <span className="font-medium">{gw.display_name}</span>
                            </div>
                            <Badge variant="outline">{feeText}</Badge>
                          </div>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Bank transfer info display */}
          {bankInfo && (
            <div className="bg-muted/30 p-4 rounded-lg space-y-2 text-sm">
              <h3 className="font-semibold">银行转账信息</h3>
              {bankInfo.bank_name && <div>银行: {bankInfo.bank_name}</div>}
              {bankInfo.account_name && <div>户名: {bankInfo.account_name}</div>}
              {bankInfo.account_number && <div>账号: {bankInfo.account_number}</div>}
              {bankInfo.swift_code && <div>SWIFT: {bankInfo.swift_code}</div>}
              <div>金额: ¥{bankInfo.amount?.toLocaleString()}</div>
              <div>备注/参考号: {bankInfo.reference}</div>
              <p className="text-muted-foreground mt-2">{bankInfo.note}</p>
            </div>
          )}

          {/* Escrow badge */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium">托管交易保障</div>
                <div className="text-sm text-muted-foreground">资金托管，确保交易安全</div>
              </div>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle className="h-3 w-3 mr-1" />推荐
            </Badge>
          </div>

          {/* Pay button */}
          <Button
            onClick={handlePayment}
            disabled={isProcessing || !paymentMethod}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <><Clock className="h-4 w-4 mr-2 animate-spin" />处理中...</>
            ) : paymentMethod === 'bank_transfer' ? (
              '获取转账信息'
            ) : (
              <>支付 ¥{total.toLocaleString()} <ExternalLink className="h-4 w-4 ml-2" /></>
            )}
          </Button>

          <div className="text-xs text-muted-foreground text-center">
            点击支付即表示您同意我们的服务条款和隐私政策
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

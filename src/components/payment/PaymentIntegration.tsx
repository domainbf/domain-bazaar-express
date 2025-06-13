
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Shield,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { Domain } from '@/types/domain';

interface PaymentIntegrationProps {
  domain: Domain;
  onPaymentSuccess: () => void;
  onClose: () => void;
}

export const PaymentIntegration: React.FC<PaymentIntegrationProps> = ({
  domain,
  onPaymentSuccess,
  onClose
}) => {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    holderName: '',
    installments: '1',
    useEscrow: true
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentMethods = [
    {
      id: 'credit_card',
      name: '信用卡/借记卡',
      icon: CreditCard,
      description: '支持Visa、MasterCard、银联',
      fee: '2.9%'
    },
    {
      id: 'alipay',
      name: '支付宝',
      icon: Smartphone,
      description: '扫码或登录支付',
      fee: '0.6%'
    },
    {
      id: 'wechat_pay',
      name: '微信支付',
      icon: Smartphone,
      description: '扫码或登录支付',
      fee: '0.6%'
    },
    {
      id: 'bank_transfer',
      name: '银行转账',
      icon: Banknote,
      description: '传统银行转账',
      fee: '免费'
    }
  ];

  const handlePayment = async () => {
    if (!paymentMethod) {
      toast.error('请选择支付方式');
      return;
    }

    setIsProcessing(true);

    try {
      // 模拟支付处理
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 创建交易记录
      const transactionData = {
        domain_id: domain.id,
        amount: domain.price,
        payment_method: paymentMethod,
        installments: Number(paymentData.installments),
        use_escrow: paymentData.useEscrow,
        payment_data: paymentData
      };
      
      console.log('Processing payment:', transactionData);
      
      toast.success('支付成功！域名转移将在24小时内完成');
      onPaymentSuccess();
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error('支付失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateFee = (method: string) => {
    const feeRates: Record<string, number> = {
      credit_card: 0.029,
      alipay: 0.006,
      wechat_pay: 0.006,
      bank_transfer: 0
    };
    return domain.price * (feeRates[method] || 0);
  };

  const selectedMethod = paymentMethods.find(m => m.id === paymentMethod);
  const fee = selectedMethod ? calculateFee(paymentMethod) : 0;
  const total = domain.price + fee;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>支付 {domain.name}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 订单摘要 */}
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

          {/* 支付方式选择 */}
          <div>
            <Label className="text-base font-semibold mb-3 block">选择支付方式</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="grid grid-cols-1 gap-3">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={method.id} id={method.id} />
                    <Label 
                      htmlFor={method.id} 
                      className="flex-1 cursor-pointer p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <method.icon className="h-5 w-5" />
                          <div>
                            <div className="font-medium">{method.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {method.description}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline">{method.fee}</Badge>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* 信用卡信息 */}
          {paymentMethod === 'credit_card' && (
            <div className="space-y-4">
              <h3 className="font-semibold">信用卡信息</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="holderName">持卡人姓名</Label>
                  <Input
                    id="holderName"
                    value={paymentData.holderName}
                    onChange={(e) => setPaymentData(prev => ({
                      ...prev,
                      holderName: e.target.value
                    }))}
                    placeholder="请输入持卡人姓名"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="cardNumber">卡号</Label>
                  <Input
                    id="cardNumber"
                    value={paymentData.cardNumber}
                    onChange={(e) => setPaymentData(prev => ({
                      ...prev,
                      cardNumber: e.target.value
                    }))}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                  />
                </div>
                <div>
                  <Label htmlFor="expiryDate">有效期</Label>
                  <Input
                    id="expiryDate"
                    value={paymentData.expiryDate}
                    onChange={(e) => setPaymentData(prev => ({
                      ...prev,
                      expiryDate: e.target.value
                    }))}
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    value={paymentData.cvv}
                    onChange={(e) => setPaymentData(prev => ({
                      ...prev,
                      cvv: e.target.value
                    }))}
                    placeholder="123"
                    maxLength={4}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 分期付款选项 */}
          {domain.price > 10000 && (
            <div>
              <Label htmlFor="installments" className="text-base font-semibold">分期付款</Label>
              <Select 
                value={paymentData.installments} 
                onValueChange={(value) => setPaymentData(prev => ({
                  ...prev,
                  installments: value
                }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">一次性付款</SelectItem>
                  <SelectItem value="3">3期分期（每期 ¥{(total/3).toLocaleString()}）</SelectItem>
                  <SelectItem value="6">6期分期（每期 ¥{(total/6).toLocaleString()}）</SelectItem>
                  <SelectItem value="12">12期分期（每期 ¥{(total/12).toLocaleString()}）</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 托管服务 */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium">使用托管服务</div>
                <div className="text-sm text-muted-foreground">
                  资金托管，确保交易安全
                </div>
              </div>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              推荐
            </Badge>
          </div>

          {/* 支付按钮 */}
          <Button
            onClick={handlePayment}
            disabled={isProcessing || !paymentMethod}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                处理中...
              </>
            ) : (
              `支付 ¥${total.toLocaleString()}`
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

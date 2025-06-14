
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  DollarSign, 
  CreditCard,
  Banknote,
  Globe,
  TrendingUp,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { Domain } from '@/types/domain';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number;
  flag: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  currencies: string[];
  fee: number;
  processingTime: string;
  icon: React.ReactNode;
}

interface MultiCurrencyPaymentProps {
  domain: Domain;
  onPaymentSuccess: () => void;
  onClose: () => void;
}

export const MultiCurrencyPayment: React.FC<MultiCurrencyPaymentProps> = ({
  domain,
  onPaymentSuccess,
  onClose
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState('CNY');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingRates, setLoadingRates] = useState(true);

  const currencies: Currency[] = [
    { code: 'CNY', name: '人民币', symbol: '¥', rate: 1, flag: '🇨🇳' },
    { code: 'USD', name: '美元', symbol: '$', rate: 0.14, flag: '🇺🇸' },
    { code: 'EUR', name: '欧元', symbol: '€', rate: 0.13, flag: '🇪🇺' },
    { code: 'JPY', name: '日元', symbol: '¥', rate: 20.8, flag: '🇯🇵' },
    { code: 'GBP', name: '英镑', symbol: '£', rate: 0.11, flag: '🇬🇧' },
    { code: 'HKD', name: '港币', symbol: 'HK$', rate: 1.09, flag: '🇭🇰' },
    { code: 'SGD', name: '新加坡元', symbol: 'S$', rate: 0.19, flag: '🇸🇬' },
    { code: 'AUD', name: '澳元', symbol: 'A$', rate: 0.21, flag: '🇦🇺' }
  ];

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'alipay',
      name: '支付宝',
      type: 'digital_wallet',
      currencies: ['CNY', 'USD', 'EUR'],
      fee: 0.6,
      processingTime: '即时',
      icon: <CreditCard className="h-5 w-5" />
    },
    {
      id: 'wechat_pay',
      name: '微信支付',
      type: 'digital_wallet',
      currencies: ['CNY', 'USD'],
      fee: 0.6,
      processingTime: '即时',
      icon: <CreditCard className="h-5 w-5" />
    },
    {
      id: 'paypal',
      name: 'PayPal',
      type: 'digital_wallet',
      currencies: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'SGD'],
      fee: 2.9,
      processingTime: '即时',
      icon: <CreditCard className="h-5 w-5" />
    },
    {
      id: 'stripe',
      name: '信用卡/借记卡',
      type: 'card',
      currencies: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'SGD', 'HKD'],
      fee: 2.9,
      processingTime: '即时',
      icon: <CreditCard className="h-5 w-5" />
    },
    {
      id: 'bank_transfer',
      name: '银行转账',
      type: 'bank',
      currencies: ['CNY', 'USD', 'EUR', 'GBP', 'JPY', 'HKD'],
      fee: 0,
      processingTime: '1-3个工作日',
      icon: <Banknote className="h-5 w-5" />
    },
    {
      id: 'crypto',
      name: '加密货币',
      type: 'crypto',
      currencies: ['USD', 'EUR'],
      fee: 1.0,
      processingTime: '10-30分钟',
      icon: <DollarSign className="h-5 w-5" />
    }
  ];

  useEffect(() => {
    loadExchangeRates();
  }, []);

  const loadExchangeRates = async () => {
    setLoadingRates(true);
    try {
      // 模拟汇率API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟实时汇率数据
      const rates = {
        CNY: 1,
        USD: 0.14 + (Math.random() - 0.5) * 0.01,
        EUR: 0.13 + (Math.random() - 0.5) * 0.01,
        JPY: 20.8 + (Math.random() - 0.5) * 1,
        GBP: 0.11 + (Math.random() - 0.5) * 0.01,
        HKD: 1.09 + (Math.random() - 0.5) * 0.05,
        SGD: 0.19 + (Math.random() - 0.5) * 0.01,
        AUD: 0.21 + (Math.random() - 0.5) * 0.01
      };
      
      setExchangeRates(rates);
    } catch (error) {
      console.error('Error loading exchange rates:', error);
      toast.error('汇率加载失败，使用默认汇率');
    } finally {
      setLoadingRates(false);
    }
  };

  const getConvertedPrice = (currency: string) => {
    const rate = exchangeRates[currency] || currencies.find(c => c.code === currency)?.rate || 1;
    return domain.price * rate;
  };

  const getCurrentCurrency = () => {
    return currencies.find(c => c.code === selectedCurrency) || currencies[0];
  };

  const getAvailablePaymentMethods = () => {
    return paymentMethods.filter(method => 
      method.currencies.includes(selectedCurrency)
    );
  };

  const calculateFee = (methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId);
    if (!method) return 0;
    
    const convertedPrice = getConvertedPrice(selectedCurrency);
    return convertedPrice * (method.fee / 100);
  };

  const calculateTotal = () => {
    const convertedPrice = getConvertedPrice(selectedCurrency);
    const fee = selectedPaymentMethod ? calculateFee(selectedPaymentMethod) : 0;
    return convertedPrice + fee;
  };

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      toast.error('请选择支付方式');
      return;
    }

    setIsLoading(true);
    try {
      // 模拟支付处理
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const paymentData = {
        domain_id: domain.id,
        amount: calculateTotal(),
        currency: selectedCurrency,
        payment_method: selectedPaymentMethod,
        exchange_rate: exchangeRates[selectedCurrency] || getCurrentCurrency().rate,
        original_amount: domain.price,
        original_currency: 'CNY'
      };
      
      console.log('Processing multi-currency payment:', paymentData);
      
      toast.success(`支付成功！已使用${getCurrentCurrency().name}完成交易`);
      onPaymentSuccess();
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error('支付失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const currency = getCurrentCurrency();
  const convertedPrice = getConvertedPrice(selectedCurrency);
  const fee = selectedPaymentMethod ? calculateFee(selectedPaymentMethod) : 0;
  const total = calculateTotal();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <span>多货币支付 - {domain.name}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 货币选择 */}
          <div>
            <Label className="text-base font-semibold mb-3 block">选择支付货币</Label>
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((curr) => (
                  <SelectItem key={curr.code} value={curr.code}>
                    <div className="flex items-center gap-2">
                      <span>{curr.flag}</span>
                      <span>{curr.name} ({curr.code})</span>
                      {loadingRates ? (
                        <span className="text-muted-foreground">加载中...</span>
                      ) : (
                        <span className="text-muted-foreground">
                          {curr.symbol}{getConvertedPrice(curr.code).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 价格显示 */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>原始价格 (CNY)</span>
                  <span className="font-medium">¥{domain.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span>转换价格 ({selectedCurrency})</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">
                      {currency.symbol}{convertedPrice.toFixed(2)}
                    </span>
                    {loadingRates && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
                  </div>
                </div>
                {selectedCurrency !== 'CNY' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>汇率: 1 CNY = {(exchangeRates[selectedCurrency] || currency.rate).toFixed(4)} {selectedCurrency}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 支付方式选择 */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              选择支付方式 (支持{currency.name})
            </Label>
            <div className="grid grid-cols-1 gap-3">
              {getAvailablePaymentMethods().map((method) => (
                <div
                  key={method.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPaymentMethod === method.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {method.icon}
                      <div>
                        <div className="font-medium">{method.name}</div>
                        <div className="text-sm text-muted-foreground">
                          处理时间: {method.processingTime}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">
                        {method.fee}% 手续费
                      </Badge>
                      {selectedPaymentMethod === method.id && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {currency.symbol}{calculateFee(method.id).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 费用明细 */}
          {selectedPaymentMethod && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>商品价格</span>
                    <span>{currency.symbol}{convertedPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>手续费</span>
                    <span>{currency.symbol}{fee.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>总计</span>
                    <span>{currency.symbol}{total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 汇率提醒 */}
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Info className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <div className="font-medium mb-1">汇率说明</div>
              <ul className="text-xs space-y-1">
                <li>• 汇率每分钟更新，实际支付时可能有微小差异</li>
                <li>• 银行或支付机构可能收取额外的货币转换费</li>
                <li>• 建议在汇率波动较小时完成支付</li>
              </ul>
            </div>
          </div>

          {/* 支付按钮 */}
          <Button
            onClick={handlePayment}
            disabled={isLoading || !selectedPaymentMethod || loadingRates}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                处理中...
              </>
            ) : (
              `确认支付 ${currency.symbol}${total.toFixed(2)}`
            )}
          </Button>

          <div className="text-xs text-muted-foreground text-center">
            点击支付即表示您同意按当前汇率完成交易
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

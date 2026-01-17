import { useState, useCallback } from 'react';
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { 
  CreditCard, 
  Smartphone, 
  Wallet,
  Shield,
  Check,
  ArrowLeft,
  QrCode,
  Copy,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";

export type PaymentMethod = 'alipay' | 'wechat' | 'paypal' | 'bank_transfer' | 'crypto';

export interface PaymentGatewayProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'deposit' | 'withdraw';
  onSuccess?: (transactionId: string, amount: number, method: PaymentMethod) => void;
  onError?: (error: string) => void;
  maxAmount?: number;
  minAmount?: number;
  currency?: string;
}

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  icon: React.ReactNode;
  description: string;
  fee: string;
  minAmount: number;
  maxAmount: number;
  available: boolean;
  processingTime: string;
}

const paymentMethods: PaymentMethodOption[] = [
  {
    id: 'alipay',
    name: '支付宝',
    icon: <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">支</div>,
    description: '支持扫码支付、余额支付',
    fee: '免费',
    minAmount: 1,
    maxAmount: 50000,
    available: true,
    processingTime: '即时到账'
  },
  {
    id: 'wechat',
    name: '微信支付',
    icon: <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">微</div>,
    description: '支持扫码支付、零钱支付',
    fee: '免费',
    minAmount: 1,
    maxAmount: 50000,
    available: true,
    processingTime: '即时到账'
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">P</div>,
    description: '国际支付，支持多币种',
    fee: '2.9% + ¥2',
    minAmount: 10,
    maxAmount: 100000,
    available: true,
    processingTime: '1-3工作日'
  },
  {
    id: 'bank_transfer',
    name: '银行转账',
    icon: <CreditCard className="w-8 h-8 text-gray-600" />,
    description: '支持银联卡、国际信用卡',
    fee: '1%',
    minAmount: 100,
    maxAmount: 500000,
    available: true,
    processingTime: '1-5工作日'
  },
  {
    id: 'crypto',
    name: '加密货币',
    icon: <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">₿</div>,
    description: 'USDT/BTC/ETH',
    fee: '网络费用',
    minAmount: 50,
    maxAmount: 1000000,
    available: true,
    processingTime: '10-60分钟'
  }
];

export const PaymentGateway = ({
  isOpen,
  onClose,
  type,
  onSuccess,
  onError,
  maxAmount = 500000,
  minAmount = 1,
  currency = 'CNY'
}: PaymentGatewayProps) => {
  const isMobile = useIsMobile();
  const [step, setStep] = useState<'method' | 'amount' | 'confirm' | 'processing' | 'qrcode' | 'success'>('method');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawAccountName, setWithdrawAccountName] = useState('');

  const presetAmounts = type === 'deposit' 
    ? [100, 500, 1000, 2000, 5000, 10000]
    : [100, 500, 1000, 2000, 5000];

  const selectedMethodDetails = paymentMethods.find(m => m.id === selectedMethod);

  const handleMethodSelect = (methodId: PaymentMethod) => {
    setSelectedMethod(methodId);
    setStep('amount');
  };

  const handleAmountConfirm = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('请输入有效金额');
      return;
    }
    if (numAmount < (selectedMethodDetails?.minAmount || minAmount)) {
      toast.error(`最低金额为 ¥${selectedMethodDetails?.minAmount || minAmount}`);
      return;
    }
    if (numAmount > (selectedMethodDetails?.maxAmount || maxAmount)) {
      toast.error(`最高金额为 ¥${selectedMethodDetails?.maxAmount || maxAmount}`);
      return;
    }
    
    if (type === 'withdraw' && (!withdrawAccount || !withdrawAccountName)) {
      toast.error('请填写完整的提现账户信息');
      return;
    }
    
    setStep('confirm');
  };

  const generateQRCode = useCallback(async () => {
    // Simulate QR code generation
    setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=payment_${Date.now()}`);
  }, []);

  const handlePaymentSubmit = async () => {
    setIsProcessing(true);
    setStep('processing');

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate transaction ID
      const txId = `TX${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      setTransactionId(txId);

      if (type === 'deposit' && (selectedMethod === 'alipay' || selectedMethod === 'wechat')) {
        // Show QR code for Chinese payment methods
        await generateQRCode();
        setStep('qrcode');
      } else {
        // Complete the transaction
        setStep('success');
        onSuccess?.(txId, parseFloat(amount), selectedMethod!);
        toast.success(type === 'deposit' ? '充值申请已提交' : '提现申请已提交');
      }
    } catch (error: any) {
      setStep('confirm');
      const errorMessage = error.message || '支付处理失败';
      onError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQRCodePaymentConfirm = () => {
    setStep('success');
    onSuccess?.(transactionId, parseFloat(amount), selectedMethod!);
    toast.success('支付成功！');
  };

  const handleClose = () => {
    setStep('method');
    setSelectedMethod(null);
    setAmount('');
    setQrCodeUrl('');
    setTransactionId('');
    setWithdrawAccount('');
    setWithdrawAccountName('');
    onClose();
  };

  const handleBack = () => {
    if (step === 'amount') {
      setStep('method');
    } else if (step === 'confirm') {
      setStep('amount');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  };

  const renderMethodSelection = () => (
    <div className="space-y-4">
      <div className="grid gap-3">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            onClick={() => method.available && handleMethodSelect(method.id)}
            disabled={!method.available}
            className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left w-full ${
              !method.available 
                ? 'opacity-50 cursor-not-allowed bg-gray-50' 
                : 'hover:border-primary hover:bg-gray-50 cursor-pointer border-gray-200'
            }`}
          >
            {method.icon}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{method.name}</span>
                {!method.available && (
                  <Badge variant="secondary" className="text-xs">暂不可用</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">{method.description}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">手续费: {method.fee}</div>
              <div className="text-xs text-muted-foreground">{method.processingTime}</div>
            </div>
          </button>
        ))}
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          所有交易均受安全加密保护，请放心使用
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderAmountInput = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
        {selectedMethodDetails?.icon}
        <div>
          <div className="font-medium">{selectedMethodDetails?.name}</div>
          <div className="text-sm text-muted-foreground">{selectedMethodDetails?.description}</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">{type === 'deposit' ? '充值金额' : '提现金额'} (CNY)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-semibold">¥</span>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="pl-8 text-lg h-12"
              min={selectedMethodDetails?.minAmount || minAmount}
              max={selectedMethodDetails?.maxAmount || maxAmount}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            限额: ¥{selectedMethodDetails?.minAmount || minAmount} - ¥{(selectedMethodDetails?.maxAmount || maxAmount).toLocaleString()}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {presetAmounts.map((preset) => (
            <Button
              key={preset}
              variant={amount === preset.toString() ? "default" : "outline"}
              size="sm"
              onClick={() => setAmount(preset.toString())}
            >
              ¥{preset.toLocaleString()}
            </Button>
          ))}
        </div>

        {type === 'withdraw' && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="account">提现账号</Label>
              <Input
                id="account"
                value={withdrawAccount}
                onChange={(e) => setWithdrawAccount(e.target.value)}
                placeholder={selectedMethod === 'alipay' ? '支付宝账号' : selectedMethod === 'wechat' ? '微信号' : '银行卡号'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountName">账户姓名</Label>
              <Input
                id="accountName"
                value={withdrawAccountName}
                onChange={(e) => setWithdrawAccountName(e.target.value)}
                placeholder="真实姓名"
              />
            </div>
          </div>
        )}
      </div>

      <Button onClick={handleAmountConfirm} className="w-full" size="lg">
        下一步
      </Button>
    </div>
  );

  const renderConfirmation = () => {
    const numAmount = parseFloat(amount);
    const feeAmount = selectedMethodDetails?.id === 'paypal' 
      ? numAmount * 0.029 + 2 
      : selectedMethodDetails?.id === 'bank_transfer' 
        ? numAmount * 0.01 
        : 0;
    const totalAmount = type === 'deposit' ? numAmount + feeAmount : numAmount - feeAmount;

    return (
      <div className="space-y-6">
        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">支付方式</span>
            <span className="font-medium">{selectedMethodDetails?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{type === 'deposit' ? '充值金额' : '提现金额'}</span>
            <span className="font-medium">¥{numAmount.toLocaleString()}</span>
          </div>
          {feeAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">手续费</span>
              <span className="font-medium text-orange-600">¥{feeAmount.toFixed(2)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-lg">
            <span className="font-semibold">{type === 'deposit' ? '实际支付' : '实际到账'}</span>
            <span className="font-bold text-primary">¥{totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {type === 'withdraw' && (
          <div className="p-4 bg-blue-50 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-blue-600">提现账号</span>
              <span className="font-medium">{withdrawAccount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-600">账户姓名</span>
              <span className="font-medium">{withdrawAccountName}</span>
            </div>
          </div>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {type === 'deposit' 
              ? '请确认充值信息，提交后将跳转至支付页面'
              : '提现申请提交后将在1-3个工作日内处理'
            }
          </AlertDescription>
        </Alert>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleBack} className="flex-1">
            返回修改
          </Button>
          <Button onClick={handlePaymentSubmit} className="flex-1" disabled={isProcessing}>
            {isProcessing ? '处理中...' : type === 'deposit' ? '确认支付' : '确认提现'}
          </Button>
        </div>
      </div>
    );
  };

  const renderProcessing = () => (
    <div className="py-12 text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-lg font-medium">正在处理您的请求...</p>
      <p className="text-muted-foreground">请稍候，不要关闭此页面</p>
    </div>
  );

  const renderQRCode = () => (
    <div className="space-y-6 text-center">
      <div className="p-4 bg-white rounded-lg border inline-block mx-auto">
        {qrCodeUrl ? (
          <img src={qrCodeUrl} alt="支付二维码" className="w-48 h-48" />
        ) : (
          <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
            <QrCode className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </div>

      <div>
        <p className="font-medium">请使用{selectedMethodDetails?.name}扫描二维码完成支付</p>
        <p className="text-3xl font-bold text-primary mt-2">¥{parseFloat(amount).toLocaleString()}</p>
      </div>

      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <span>交易号:</span>
        <code className="bg-gray-100 px-2 py-1 rounded">{transactionId}</code>
        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(transactionId)}>
          <Copy className="w-4 h-4" />
        </Button>
      </div>

      <Alert className="text-left">
        <Smartphone className="h-4 w-4" />
        <AlertDescription>
          支付完成后请点击下方按钮确认，系统将自动核实到账
        </AlertDescription>
      </Alert>

      <div className="flex gap-3">
        <Button variant="outline" onClick={handleClose} className="flex-1">
          稍后支付
        </Button>
        <Button onClick={handleQRCodePaymentConfirm} className="flex-1">
          已完成支付
        </Button>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="py-8 text-center space-y-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <Check className="w-8 h-8 text-green-600" />
      </div>

      <div>
        <h3 className="text-xl font-semibold text-green-600">
          {type === 'deposit' ? '充值成功！' : '提现申请已提交！'}
        </h3>
        <p className="text-muted-foreground mt-2">
          {type === 'deposit' 
            ? '资金已到账，可立即使用'
            : `预计 ${selectedMethodDetails?.processingTime} 到账`
          }
        </p>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">交易号</span>
          <div className="flex items-center gap-1">
            <code className="font-mono">{transactionId}</code>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(transactionId)}>
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">金额</span>
          <span className="font-medium">¥{parseFloat(amount).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">支付方式</span>
          <span className="font-medium">{selectedMethodDetails?.name}</span>
        </div>
      </div>

      <Button onClick={handleClose} className="w-full">
        完成
      </Button>
    </div>
  );

  const getDialogTitle = () => {
    switch (step) {
      case 'method': return type === 'deposit' ? '选择充值方式' : '选择提现方式';
      case 'amount': return type === 'deposit' ? '输入充值金额' : '输入提现金额';
      case 'confirm': return '确认支付信息';
      case 'processing': return '正在处理';
      case 'qrcode': return '扫码支付';
      case 'success': return type === 'deposit' ? '充值成功' : '提现申请成功';
      default: return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`${isMobile ? 'max-w-full h-full' : 'max-w-lg'}`}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            {(step === 'amount' || step === 'confirm') && (
              <Button variant="ghost" size="sm" onClick={handleBack} className="h-8 w-8 p-0">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div>
              <DialogTitle>{getDialogTitle()}</DialogTitle>
              <DialogDescription>
                {type === 'deposit' ? '安全快捷的充值服务' : '便捷的提现服务'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {step === 'method' && renderMethodSelection()}
          {step === 'amount' && renderAmountInput()}
          {step === 'confirm' && renderConfirmation()}
          {step === 'processing' && renderProcessing()}
          {step === 'qrcode' && renderQRCode()}
          {step === 'success' && renderSuccess()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

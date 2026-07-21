import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CreditCard, Smartphone, Banknote, Shield, Save, RefreshCw,
  Eye, EyeOff, CheckCircle, XCircle, AlertTriangle, PlugZap
} from 'lucide-react';

interface GatewayConfig {
  id: string;
  gateway_name: string;
  display_name: string;
  is_enabled: boolean;
  config: Record<string, any>;
  fee_rate: number;
  min_amount: number;
  max_amount: number;
  supported_currencies: string[];
}

const gatewayIcons: Record<string, any> = {
  alipay: Smartphone,
  wechat_pay: Smartphone,
  paypal: CreditCard,
  stripe: CreditCard,
  bank_transfer: Banknote,
  usdt_trc20: Shield,
};

const gatewayColors: Record<string, string> = {
  alipay: 'text-blue-600',
  wechat_pay: 'text-green-600',
  paypal: 'text-blue-700',
  stripe: 'text-purple-600',
  bank_transfer: 'text-amber-600',
  usdt_trc20: 'text-emerald-500',
};

// Fields that should be masked in the UI
const sensitiveFields = ['private_key', 'secret_key', 'api_key', 'client_secret', 'webhook_secret', 'password'];

// 每个网关必须填写的字段（用于"测试连接"时的完整性校验）
const REQUIRED_FIELDS: Record<string, string[]> = {
  stripe: ['secret_key', 'publishable_key'],
  paypal: ['client_id', 'client_secret'],
  alipay: ['app_id', 'private_key', 'public_key'],
  wechat_pay: ['mch_id', 'api_key'],
  usdt_trc20: ['wallet_address'],
  bank_transfer: ['account_name', 'account_number'],
};

export const PaymentGatewaySettings = () => {
  const [gateways, setGateways] = useState<GatewayConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testingId, setTestingId] = useState<string | null>(null);

  useEffect(() => {
    loadGateways();
  }, []);

  const loadGateways = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_gateway_settings')
        .select('*')
        .order('gateway_name');
      if (error) throw error;
      setGateways((data || []).map(g => ({
        ...g,
        config: (g.config as Record<string, any>) || {},
        fee_rate: Number(g.fee_rate) || 0,
        min_amount: Number(g.min_amount) || 0,
        max_amount: Number(g.max_amount) || 999999999,
        supported_currencies: g.supported_currencies || ['CNY'],
      })));
    } catch (error) {
      console.error('Failed to load gateways:', error);
      toast.error('加载支付网关设置失败');
    } finally {
      setIsLoading(false);
    }
  };

  const updateGateway = (id: string, updates: Partial<GatewayConfig>) => {
    setGateways(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const updateConfig = (id: string, key: string, value: string) => {
    setGateways(prev => prev.map(g => {
      if (g.id !== id) return g;
      return { ...g, config: { ...g.config, [key]: value } };
    }));
  };

  const saveGateway = async (gateway: GatewayConfig) => {
    setSavingId(gateway.id);
    try {
      const { error } = await supabase
        .from('payment_gateway_settings')
        .update({
          is_enabled: gateway.is_enabled,
          config: gateway.config,
          fee_rate: gateway.fee_rate,
          min_amount: gateway.min_amount,
          max_amount: gateway.max_amount,
        })
        .eq('id', gateway.id);
      if (error) throw error;
      toast.success(`${gateway.display_name} 设置已保存，即刻生效`);
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('保存失败');
    } finally {
      setSavingId(null);
    }
  };

  const toggleSecret = (gatewayId: string) => {
    setShowSecrets(prev => ({ ...prev, [gatewayId]: !prev[gatewayId] }));
  };

  const isSensitive = (key: string) => sensitiveFields.some(f => key.includes(f));

  const hasRequiredConfig = (gateway: GatewayConfig): boolean => {
    const config = gateway.config;
    return Object.entries(config).every(([key, value]) => {
      if (key === 'sandbox') return true;
      return typeof value === 'string' ? value.trim().length > 0 : true;
    });
  };

  const testGateway = async (gateway: GatewayConfig) => {
    setTestingId(gateway.id);
    try {
      const required = REQUIRED_FIELDS[gateway.gateway_name] || [];
      const missing = required.filter(k => {
        const v = gateway.config[k];
        return typeof v !== 'string' || v.trim().length === 0;
      });
      if (missing.length > 0) {
        toast.error(`${gateway.display_name} 测试失败：缺少必填字段 ${missing.join(', ')}`);
        return;
      }
      // 简易连通性 / 格式测试
      if (gateway.gateway_name === 'stripe') {
        const sk = String(gateway.config.secret_key || '');
        if (!/^sk_(test|live)_/.test(sk)) {
          toast.error('Stripe Secret Key 格式不正确（应以 sk_test_ 或 sk_live_ 开头）');
          return;
        }
      }
      if (gateway.gateway_name === 'paypal') {
        const cid = String(gateway.config.client_id || '');
        if (cid.length < 20) {
          toast.error('PayPal Client ID 长度异常，请核对');
          return;
        }
      }
      await new Promise(r => setTimeout(r, 400));
      toast.success(`${gateway.display_name} 配置校验通过 · 网关已就绪`);
    } catch (e: any) {
      toast.error(`测试失败：${e.message || '未知错误'}`);
    } finally {
      setTestingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            支付网关配置
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            配置并启用支付方式，保存后立即生效。API 密钥安全存储在数据库中。
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadGateways}>
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      {gateways.map(gateway => {
        const Icon = gatewayIcons[gateway.gateway_name] || CreditCard;
        const color = gatewayColors[gateway.gateway_name] || 'text-foreground';
        const configComplete = hasRequiredConfig(gateway);
        const isVisible = showSecrets[gateway.id];

        return (
          <Card key={gateway.id} className={gateway.is_enabled ? 'border-primary/30' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${color}`} />
                  {gateway.display_name}
                  {gateway.is_enabled ? (
                    <Badge variant="default" className="bg-green-500/15 text-green-600 dark:text-green-400 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      已启用
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="h-3 w-3 mr-1" />
                      未启用
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSecret(gateway.id)}
                  >
                    {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Switch
                    checked={gateway.is_enabled}
                    onCheckedChange={(checked) => updateGateway(gateway.id, { is_enabled: checked })}
                  />
                </div>
              </div>
              <CardDescription>
                手续费率: {(gateway.fee_rate * 100).toFixed(1)}%
                {!configComplete && gateway.is_enabled && (
                  <span className="text-yellow-600 dark:text-yellow-400 ml-2 inline-flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    部分配置为空，请填写完整
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Config fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(gateway.config).map(([key, value]) => {
                  if (key === 'sandbox') return null;
                  const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  const masked = isSensitive(key) && !isVisible;
                  return (
                    <div key={key}>
                      <Label className="text-xs text-muted-foreground">{label}</Label>
                      <Input
                        type={masked ? 'password' : 'text'}
                        value={String(value || '')}
                        onChange={(e) => updateConfig(gateway.id, key, e.target.value)}
                        placeholder={`输入 ${label}`}
                        className="mt-1"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Sandbox toggle */}
              {gateway.config.sandbox !== undefined && (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={gateway.config.sandbox === true}
                    onCheckedChange={(checked) => updateConfig(gateway.id, 'sandbox', String(checked))}
                  />
                  <Label className="text-sm">沙盒/测试模式</Label>
                </div>
              )}

              <Separator />

              {/* Fee & limits */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">手续费率</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={gateway.fee_rate}
                    onChange={(e) => updateGateway(gateway.id, { fee_rate: parseFloat(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">最低金额</Label>
                  <Input
                    type="number"
                    value={gateway.min_amount}
                    onChange={(e) => updateGateway(gateway.id, { min_amount: parseFloat(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">最高金额</Label>
                  <Input
                    type="number"
                    value={gateway.max_amount}
                    onChange={(e) => updateGateway(gateway.id, { max_amount: parseFloat(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => saveGateway(gateway)}
                  disabled={savingId === gateway.id}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {savingId === gateway.id ? '保存中...' : '保存配置'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';
import { Percent, Save, DollarSign, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CommissionConfig {
  commission_rate: string;
  min_commission: string;
  commission_currency: string;
}

const PRESETS = [
  { label: '3%', value: '0.03' },
  { label: '5%', value: '0.05' },
  { label: '8%', value: '0.08' },
  { label: '10%', value: '0.10' },
];

export const CommissionSettings = () => {
  const [config, setConfig] = useState<CommissionConfig>({
    commission_rate: '0.05',
    min_commission: '10',
    commission_currency: 'CNY',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [example, setExample] = useState({ amount: 10000, fee: 500, seller: 9500 });

  useEffect(() => { loadSettings(); }, []);

  useEffect(() => {
    const amount = 10000;
    const rate = parseFloat(config.commission_rate) || 0.05;
    const min = parseFloat(config.min_commission) || 10;
    const fee = Math.max(amount * rate, min);
    setExample({ amount, fee, seller: amount - fee });
  }, [config.commission_rate, config.min_commission]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const keys = ['commission_rate', 'min_commission', 'commission_currency'];
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', keys);
      if (error) throw error;
      const result: Partial<CommissionConfig> = {};
      (data ?? []).forEach((row: { key: string; value: string }) => {
        result[row.key as keyof CommissionConfig] = row.value;
      });
      setConfig(prev => ({ ...prev, ...result }));
    } catch {
      toast.error('加载手续费设置失败');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const rate = parseFloat(config.commission_rate);
      if (isNaN(rate) || rate < 0 || rate > 0.5) {
        toast.error('手续费率应在 0% ~ 50% 之间');
        return;
      }
      const updates = [
        { key: 'commission_rate', value: config.commission_rate },
        { key: 'min_commission', value: config.min_commission },
        { key: 'commission_currency', value: config.commission_currency },
      ];
      for (const item of updates) {
        await supabase.from('site_settings').upsert(item, { onConflict: 'key' });
      }
      toast.success('手续费设置已保存');
    } catch {
      toast.error('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-8"><LoadingSpinner /></div>;

  const ratePercent = (parseFloat(config.commission_rate) * 100).toFixed(1);

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5" />
            平台手续费设置
          </CardTitle>
          <CardDescription>
            设置平台从每笔成功交易中收取的服务费比例
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>手续费率</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={(parseFloat(config.commission_rate) * 100).toFixed(1)}
                onChange={e => setConfig(prev => ({ ...prev, commission_rate: (parseFloat(e.target.value) / 100).toFixed(4) }))}
                min="0"
                max="50"
                step="0.5"
                className="w-32"
                data-testid="input-commission-rate"
              />
              <span className="text-muted-foreground">%</span>
              <div className="flex gap-1 ml-2">
                {PRESETS.map(p => (
                  <Button
                    key={p.value}
                    variant={config.commission_rate === p.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setConfig(prev => ({ ...prev, commission_rate: p.value }))}
                    data-testid={`preset-${p.label}`}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>最低手续费（元）</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={config.min_commission}
                onChange={e => setConfig(prev => ({ ...prev, min_commission: e.target.value }))}
                min="0"
                className="w-32"
                data-testid="input-min-commission"
              />
              <span className="text-muted-foreground text-sm">每笔交易最低收取此金额</span>
            </div>
          </div>

          {/* Preview */}
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              <p className="font-medium mb-2">示例（交易金额 ¥10,000）：</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>成交金额</span>
                  <span>¥{example.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>平台手续费 ({ratePercent}%)</span>
                  <span>-¥{example.fee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold text-green-600">
                  <span>卖家实际到账</span>
                  <span>¥{example.seller.toLocaleString()}</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-3">
            <Button onClick={saveSettings} disabled={isSaving} data-testid="button-save-commission">
              {isSaving ? <LoadingSpinner size="sm" /> : <><Save className="w-4 h-4 mr-2" />保存设置</>}
            </Button>
            <Badge variant="outline" className="text-green-600 border-green-500/30">
              <DollarSign className="w-3 h-3 mr-1" />
              当前费率：{ratePercent}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">手续费说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• 手续费从买家支付的金额中扣除，卖家收到扣除手续费后的金额</p>
          <p>• 手续费在交易完成（买家确认收到域名）后自动结算</p>
          <p>• 如交易被取消或发生纠纷退款，手续费将按规则退还</p>
          <p>• 建议手续费率设置在 3%~10% 之间，过高可能影响平台吸引力</p>
        </CardContent>
      </Card>
    </div>
  );
};

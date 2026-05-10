import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { GitMerge, Save, RefreshCw } from 'lucide-react';

const STRATEGIES = [
  { value: 'auto_merge', label: '自动归并到首条', desc: '5分钟内重复提交直接复用第一条记录，仅记录命中次数。（推荐）' },
  { value: 'shadow_record', label: '创建影子记录', desc: '仍写入新行，但标记 duplicate_of=首条id，便于人工审核。' },
  { value: 'reject', label: '拒绝重复', desc: '5分钟内重复提交直接拒绝，前端显示"请勿重复提交"。' },
];

export const MergeStrategyManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [strategy, setStrategy] = useState('auto_merge');
  const [windowSec, setWindowSec] = useState('300');
  const [duplicates, setDuplicates] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: settings }, { data: dupRows }] = await Promise.all([
        supabase.from('site_settings').select('key, value').in('key', ['offer_merge_strategy', 'offer_idempotency_window_sec']),
        supabase
          .from('domain_offers')
          .select('id, contact_email, amount, currency, duplicate_count, last_duplicate_at, created_at, idempotency_key')
          .gt('duplicate_count', 0)
          .order('last_duplicate_at', { ascending: false })
          .limit(50),
      ]);
      const map: Record<string, string> = {};
      for (const s of settings || []) if (s.key) map[s.key] = s.value || '';
      setStrategy(map['offer_merge_strategy'] || 'auto_merge');
      setWindowSec(map['offer_idempotency_window_sec'] || '300');
      setDuplicates(dupRows || []);
    } catch (err: any) {
      toast.error('加载失败：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const upserts = [
        { key: 'offer_merge_strategy', value: strategy, type: 'text', section: 'offers' },
        { key: 'offer_idempotency_window_sec', value: windowSec, type: 'number', section: 'offers' },
      ];
      const { error } = await supabase.from('site_settings').upsert(upserts, { onConflict: 'key' });
      if (error) throw error;
      toast.success('合并策略已更新');
    } catch (err: any) {
      toast.error('保存失败：' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const totalDuplicates = useMemo(
    () => duplicates.reduce((s, d) => s + (d.duplicate_count || 0), 0),
    [duplicates]
  );

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><GitMerge className="h-5 w-5" />重复合并策略</CardTitle>
          <CardDescription>配置在幂等窗口内收到相同报价（域名+买家+金额）时的处理方式。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm">合并策略</Label>
            <Select value={strategy} onValueChange={setStrategy}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STRATEGIES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {STRATEGIES.find(s => s.value === strategy)?.desc}
            </p>
          </div>
          <div>
            <Label className="text-sm">幂等窗口（秒）</Label>
            <Input type="number" min="60" max="3600" value={windowSec} onChange={(e) => setWindowSec(e.target.value)} />
            <p className="text-xs text-muted-foreground mt-1">在该时间窗口内的相同请求会被视为重复，建议 300（5分钟）。</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />{saving ? '保存中...' : '保存策略'}
            </Button>
            <Button variant="outline" onClick={load}>
              <RefreshCw className="h-4 w-4 mr-2" />刷新
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>近期重复命中报价</span>
            <Badge variant="secondary">累计 {totalDuplicates} 次重复</Badge>
          </CardTitle>
          <CardDescription>当前共 {duplicates.length} 条报价记录有重复命中。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">联系邮箱</th>
                  <th className="text-left p-3 font-medium">金额</th>
                  <th className="text-left p-3 font-medium">重复次数</th>
                  <th className="text-left p-3 font-medium">最近命中</th>
                  <th className="text-left p-3 font-medium">幂等键</th>
                </tr>
              </thead>
              <tbody>
                {duplicates.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">暂无重复命中记录</td></tr>
                ) : duplicates.map(d => (
                  <tr key={d.id} className="border-t">
                    <td className="p-3">{d.contact_email || '—'}</td>
                    <td className="p-3">{d.currency || '¥'} {Number(d.amount || 0).toLocaleString()}</td>
                    <td className="p-3"><Badge variant="destructive">{d.duplicate_count}</Badge></td>
                    <td className="p-3 text-xs">{d.last_duplicate_at ? new Date(d.last_duplicate_at).toLocaleString() : '—'}</td>
                    <td className="p-3 text-xs font-mono text-muted-foreground max-w-[160px] truncate" title={d.idempotency_key || ''}>{d.idempotency_key || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MergeStrategyManager;

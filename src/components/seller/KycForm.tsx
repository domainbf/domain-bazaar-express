import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ShieldCheck, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export interface KycRecord {
  id: string;
  user_id: string;
  full_name: string;
  id_type: string;
  id_number: string;
  country: string | null;
  phone: string | null;
  payout_method: string;
  payout_account: string;
  payout_account_name: string | null;
  bank_name: string | null;
  notes: string | null;
  status: string;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  onStatusChange?: (status: string) => void;
  compact?: boolean;
}

const STATUS_LABEL: Record<string, { label: string; tone: any; icon: any }> = {
  pending: { label: '审核中', tone: 'secondary', icon: Clock },
  approved: { label: '已通过', tone: 'default', icon: CheckCircle2 },
  rejected: { label: '未通过', tone: 'destructive', icon: XCircle },
  incomplete: { label: '待补充', tone: 'outline', icon: AlertTriangle },
};

export default function KycForm({ onStatusChange, compact }: Props) {
  const { user } = useAuth();
  const [record, setRecord] = useState<KycRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    id_type: 'id_card',
    id_number: '',
    country: 'CN',
    phone: '',
    payout_method: 'alipay',
    payout_account: '',
    payout_account_name: '',
    bank_name: '',
    notes: '',
  });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from('seller_kyc')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) {
      setRecord(data);
      setForm({
        full_name: data.full_name || '',
        id_type: data.id_type || 'id_card',
        id_number: data.id_number || '',
        country: data.country || 'CN',
        phone: data.phone || '',
        payout_method: data.payout_method || 'alipay',
        payout_account: data.payout_account || '',
        payout_account_name: data.payout_account_name || '',
        bank_name: data.bank_name || '',
        notes: data.notes || '',
      });
      onStatusChange?.(data.status);
    } else {
      onStatusChange?.('none');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('kyc-' + user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seller_kyc', filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const submit = async () => {
    if (!user) return;
    if (!form.full_name.trim() || !form.id_number.trim() || !form.payout_account.trim()) {
      return toast.error('请填写真实姓名、证件号与收款账户');
    }
    setSaving(true);
    try {
      const payload = { ...form, user_id: user.id, status: 'pending', review_note: null };
      if (record) {
        const { error } = await (supabase as any).from('seller_kyc').update(payload).eq('id', record.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from('seller_kyc').insert(payload);
        if (error) throw error;
      }
      toast.success('资料已提交，1-3 个工作日内审核完成');
      await load();
    } catch (e: any) {
      toast.error(e.message || '提交失败');
    } finally {
      setSaving(false);
    }
  };

  const status = record?.status || 'none';
  const meta = STATUS_LABEL[status];
  const locked = status === 'pending' || status === 'approved';

  return (
    <Card>
      <CardHeader className={compact ? 'pb-3' : ''}>
        <CardTitle className="text-base flex items-center gap-2 flex-wrap">
          <ShieldCheck className="w-4 h-4" /> 实名认证与收款资料
          {meta && (
            <Badge variant={meta.tone} className="ml-auto">
              <meta.icon className="w-3 h-3 mr-1" />{meta.label}
            </Badge>
          )}
        </CardTitle>
        {status === 'rejected' && record?.review_note && (
          <p className="text-xs text-destructive mt-1">审核意见：{record.review_note}</p>
        )}
        {status === 'approved' && (
          <p className="text-xs text-muted-foreground mt-1">审核已通过 · {record?.reviewed_at ? new Date(record.reviewed_at).toLocaleString('zh-CN') : ''}</p>
        )}
        {status === 'pending' && (
          <p className="text-xs text-muted-foreground mt-1">资料已进入审核队列，通过后即可申请提现。</p>
        )}
        {status === 'none' && !loading && (
          <p className="text-xs text-muted-foreground mt-1">首次提现前需完成实名认证并绑定收款账户。</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="真实姓名" required>
            <Input value={form.full_name} disabled={locked} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="与证件一致" />
          </Field>
          <Field label="证件类型">
            <Select value={form.id_type} onValueChange={(v) => setForm({ ...form, id_type: v })} disabled={locked}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="id_card">身份证</SelectItem>
                <SelectItem value="passport">护照</SelectItem>
                <SelectItem value="business_license">营业执照</SelectItem>
                <SelectItem value="other">其他</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="证件号码" required>
            <Input value={form.id_number} disabled={locked} onChange={(e) => setForm({ ...form, id_number: e.target.value })} />
          </Field>
          <Field label="联系电话">
            <Input value={form.phone} disabled={locked} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="国家 / 地区">
            <Input value={form.country} disabled={locked} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="CN" />
          </Field>
          <Field label="收款方式">
            <Select value={form.payout_method} onValueChange={(v) => setForm({ ...form, payout_method: v })} disabled={locked}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alipay">支付宝</SelectItem>
                <SelectItem value="wechat">微信支付</SelectItem>
                <SelectItem value="bank">银行卡</SelectItem>
                <SelectItem value="usdt">USDT (TRC20)</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="收款账户" required>
            <Input value={form.payout_account} disabled={locked} onChange={(e) => setForm({ ...form, payout_account: e.target.value })} placeholder="账号 / 邮箱 / 钱包地址" />
          </Field>
          <Field label="收款人姓名">
            <Input value={form.payout_account_name} disabled={locked} onChange={(e) => setForm({ ...form, payout_account_name: e.target.value })} />
          </Field>
          {form.payout_method === 'bank' && (
            <Field label="开户银行" full>
              <Input value={form.bank_name} disabled={locked} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
            </Field>
          )}
        </div>
        <Field label="备注 (可选)">
          <Textarea rows={2} value={form.notes} disabled={locked} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Field>
        <div className="flex gap-2 flex-wrap pt-1">
          {status !== 'approved' && (
            <Button onClick={submit} disabled={saving || loading}>
              {saving ? '提交中…' : record ? (status === 'rejected' ? '重新提交审核' : '更新资料') : '提交审核'}
            </Button>
          )}
          {status === 'pending' && (
            <span className="text-xs text-muted-foreground self-center">审核期间资料不可修改，如需变更请联系客服。</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children, required, full }: { label: string; children: React.ReactNode; required?: boolean; full?: boolean }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <Label className="text-xs text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

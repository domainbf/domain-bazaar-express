import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ShieldCheck, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';

interface KycRow {
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
  status: string;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  id_front_url?: string | null;
  id_back_url?: string | null;
  id_selfie_url?: string | null;
}

const STATUS: Record<string, { label: string; tone: any }> = {
  pending: { label: '待审核', tone: 'secondary' },
  approved: { label: '已通过', tone: 'default' },
  rejected: { label: '已拒绝', tone: 'destructive' },
  incomplete: { label: '待补充', tone: 'outline' },
};

export function AdminKycReview() {
  const { user } = useAuth();
  const [rows, setRows] = useState<KycRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');
  const [selected, setSelected] = useState<KycRow | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [docUrls, setDocUrls] = useState<Record<string, string>>({});

  const signDocs = async (row: KycRow) => {
    const paths = [row.id_front_url, row.id_back_url, row.id_selfie_url].filter(Boolean) as string[];
    if (!paths.length) { setDocUrls({}); return; }
    const map: Record<string, string> = {};
    await Promise.all(paths.map(async (p) => {
      const { data } = await supabase.storage.from('kyc-documents').createSignedUrl(p, 600);
      if (data?.signedUrl) map[p] = data.signedUrl;
    }));
    setDocUrls(map);
  };

  useEffect(() => { if (selected) signDocs(selected); }, [selected?.id]);
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('seller_kyc')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? rows : rows.filter((r) => r.status === filter);

  const decide = async (status: 'approved' | 'rejected') => {
    if (!selected || !user) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any).from('seller_kyc').update({
        status,
        review_note: note.trim() || null,
        reviewer_id: user.id,
        reviewed_at: new Date().toISOString(),
      }).eq('id', selected.id);
      if (error) throw error;
      toast.success(status === 'approved' ? '审核已通过' : '已拒绝');
      setSelected(null);
      setNote('');
      await load();
    } catch (e: any) {
      toast.error(e.message || '操作失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" /> 实名认证与提现审核
          </h2>
          <p className="text-sm text-muted-foreground mt-1">审核卖家的身份资料与收款账户，通过后卖家方可提现。</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="w-4 h-4 mr-1.5" /> 刷新
        </Button>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="pending">待审核 ({rows.filter(r => r.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="approved">已通过</TabsTrigger>
          <TabsTrigger value="rejected">已拒绝</TabsTrigger>
          <TabsTrigger value="all">全部</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">申请列表 ({filtered.length})</CardTitle></CardHeader>
          <CardContent className="p-0 divide-y max-h-[560px] overflow-auto">
            {loading ? <div className="p-8 text-center text-sm text-muted-foreground">加载中…</div> :
              filtered.length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">暂无记录</div> :
              filtered.map((r) => {
                const meta = STATUS[r.status] || { label: r.status, tone: 'outline' as const };
                return (
                  <button
                    key={r.id}
                    onClick={() => { setSelected(r); setNote(r.review_note || ''); }}
                    className={`w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors ${selected?.id === r.id ? 'bg-muted/50' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{r.full_name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {r.payout_method.toUpperCase()} · {r.payout_account}
                        </div>
                      </div>
                      <Badge variant={meta.tone}>{meta.label}</Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      {new Date(r.created_at).toLocaleString('zh-CN')}
                    </div>
                  </button>
                );
              })
            }
          </CardContent>
        </Card>

        <Card className="h-fit sticky top-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">审核详情</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {!selected ? (
              <div className="text-sm text-muted-foreground py-8 text-center">从左侧选择一条记录</div>
            ) : (
              <>
                <Row label="姓名" value={selected.full_name} />
                <Row label="证件" value={`${selected.id_type} · ${selected.id_number}`} />
                <Row label="国家" value={selected.country || '—'} />
                <Row label="电话" value={selected.phone || '—'} />
                <div className="border-t pt-2" />
                <Row label="收款方式" value={selected.payout_method.toUpperCase()} />
                <Row label="账户" value={selected.payout_account} />
                <Row label="户名" value={selected.payout_account_name || '—'} />
                {selected.bank_name && <Row label="开户行" value={selected.bank_name} />}
                <div className="border-t pt-2" />
                <Row label="状态" value={<Badge variant={STATUS[selected.status]?.tone}>{STATUS[selected.status]?.label}</Badge>} />
                {selected.reviewed_at && (
                  <Row label="审核时间" value={new Date(selected.reviewed_at).toLocaleString('zh-CN')} />
                )}
                <div>
                  <div className="text-xs text-muted-foreground mb-1">审核备注 (可选)</div>
                  <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="拒绝时请说明原因，将同步给卖家" />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button className="flex-1" disabled={saving} onClick={() => decide('approved')}>
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> 通过
                  </Button>
                  <Button variant="destructive" className="flex-1" disabled={saving} onClick={() => decide('rejected')}>
                    <XCircle className="w-4 h-4 mr-1.5" /> 拒绝
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center gap-3">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm text-right truncate">{value}</span>
    </div>
  );
}

export default AdminKycReview;

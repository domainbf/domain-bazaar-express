import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/apiClient';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';
import { Shield, Clock, CheckCircle, AlertTriangle, ArrowRight, Globe, Banknote } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EscrowRecord {
  id: string;
  status: string | null;
  funded_at: string | null;
  domain_transferred_at: string | null;
  buyer_approved_at: string | null;
  released_at: string | null;
  escrow_fee: number | null;
  transaction_id: string | null;
  transaction?: {
    id: string;
    amount: number;
    status: string;
    buyer_id: string | null;
    seller_id: string | null;
    domain_id: string;
  } | null;
  domain?: { name: string } | null;
  buyer?: { full_name: string | null; username: string | null } | null;
  seller?: { full_name: string | null; username: string | null } | null;
}

interface EscrowServiceProps {
  transactionId?: string;
  isAdmin?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; progress: number }> = {
  initiated: { label: '已创建', progress: 10 },
  funded: { label: '资金托管中', progress: 40 },
  domain_transferred: { label: '域名已转移', progress: 70 },
  released: { label: '资金已释放', progress: 100 },
  disputed: { label: '纠纷处理中', progress: 50 },
};

export const EscrowService: React.FC<EscrowServiceProps> = ({ transactionId, isAdmin = false }) => {
  const { user } = useAuth();
  const [records, setRecords] = useState<EscrowRecord[]>([]);
  const [selected, setSelected] = useState<EscrowRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);

  useEffect(() => { loadEscrowRecords(); }, [transactionId, user?.id]);

  const loadEscrowRecords = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('escrow_services')
        .select('*, transaction:transactions(id, amount, status, buyer_id, seller_id, domain_id)')
        .order('created_at', { ascending: false });

      if (transactionId) {
        query = query.eq('transaction_id', transactionId);
      } else if (!isAdmin && user) {
        const { data: txIds } = await supabase
          .from('transactions')
          .select('id')
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);
        const ids = (txIds ?? []).map((t: { id: string }) => t.id);
        if (ids.length === 0) { setRecords([]); setIsLoading(false); return; }
        query = query.in('transaction_id', ids);
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;

      const enriched = await Promise.all((data ?? []).map(async (r) => {
        const tx = r.transaction as EscrowRecord['transaction'];
        if (!tx) return r as EscrowRecord;
        const [domainRes, buyerRes, sellerRes] = await Promise.all([
          supabase.from('domain_listings').select('name').eq('id', tx.domain_id).single(),
          tx.buyer_id ? supabase.from('profiles').select('full_name, username').eq('id', tx.buyer_id).single() : Promise.resolve({ data: null }),
          tx.seller_id ? supabase.from('profiles').select('full_name, username').eq('id', tx.seller_id).single() : Promise.resolve({ data: null }),
        ]);
        return { ...r, domain: domainRes.data, buyer: buyerRes.data, seller: sellerRes.data } as EscrowRecord;
      }));

      setRecords(enriched);
      if (transactionId && enriched.length > 0) setSelected(enriched[0]);
    } catch {
      toast.error('加载托管记录失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReleaseFunds = async (record: EscrowRecord) => {
    if (!record.transaction_id) return;
    setIsActing(true);
    try {
      await supabase.from('escrow_services').update({
        status: 'released',
        released_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', record.id);
      await supabase.from('transactions').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', record.transaction_id);
      toast.success('资金已释放给卖家');
      loadEscrowRecords();
    } catch {
      toast.error('操作失败');
    } finally {
      setIsActing(false);
    }
  };

  const getSteps = (record: EscrowRecord) => [
    { label: '资金托管', done: !!record.funded_at, time: record.funded_at },
    { label: '域名转移', done: !!record.domain_transferred_at, time: record.domain_transferred_at },
    { label: '买家确认', done: !!record.buyer_approved_at, time: record.buyer_approved_at },
    { label: '资金释放', done: !!record.released_at, time: record.released_at },
  ];

  if (isLoading) return <div className="flex justify-center py-8"><LoadingSpinner /></div>;

  const displayRecord = selected ?? records[0] ?? null;

  return (
    <div className="space-y-4">
      {!transactionId && (
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            资金托管记录
          </h3>
          <Badge variant="secondary">{records.length} 条</Badge>
        </div>
      )}

      {records.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">暂无托管记录</p>
        </div>
      ) : (
        <>
          {!transactionId && (
            <div className="space-y-2">
              {records.map(r => {
                const cfg = STATUS_CONFIG[r.status ?? 'initiated'];
                return (
                  <div
                    key={r.id}
                    className={`p-4 border rounded-lg cursor-pointer hover:border-primary/40 transition-colors ${selected?.id === r.id ? 'border-primary bg-primary/5' : ''}`}
                    onClick={() => setSelected(r)}
                    data-testid={`escrow-record-${r.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{r.domain?.name ?? '未知域名'}</span>
                      </div>
                      <Badge variant={r.status === 'released' ? 'default' : 'secondary'}>
                        {cfg?.label ?? r.status}
                      </Badge>
                    </div>
                    <Progress value={cfg?.progress ?? 0} className="h-1.5 mb-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{r.buyer?.full_name ?? r.buyer?.username ?? '买家'}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span>{r.seller?.full_name ?? r.seller?.username ?? '卖家'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {displayRecord && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-500" />
                    {displayRecord.domain?.name ?? '托管详情'}
                  </span>
                  {displayRecord.transaction_id && (
                    <Link to={`/transaction/${displayRecord.transaction_id}`} className="text-xs text-primary hover:underline">
                      查看交易
                    </Link>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {displayRecord.transaction && (
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="p-2 bg-muted/40 rounded text-center">
                      <p className="text-muted-foreground text-xs">托管金额</p>
                      <p className="font-bold">¥{displayRecord.transaction.amount?.toLocaleString()}</p>
                    </div>
                    {displayRecord.escrow_fee != null && (
                      <div className="p-2 bg-muted/40 rounded text-center">
                        <p className="text-muted-foreground text-xs">托管费</p>
                        <p className="font-bold">¥{displayRecord.escrow_fee}</p>
                      </div>
                    )}
                    <div className="p-2 bg-muted/40 rounded text-center">
                      <p className="text-muted-foreground text-xs">进度</p>
                      <p className="font-bold">{STATUS_CONFIG[displayRecord.status ?? 'initiated']?.progress ?? 0}%</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {getSteps(displayRecord).map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${step.done ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                        {step.done ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3 h-3" />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${step.done ? '' : 'text-muted-foreground'}`}>{step.label}</p>
                        {step.time && <p className="text-xs text-muted-foreground">{new Date(step.time).toLocaleString('zh-CN')}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                {isAdmin && displayRecord.status === 'domain_transferred' && (
                  <Button onClick={() => handleReleaseFunds(displayRecord)} disabled={isActing} className="w-full">
                    {isActing ? <LoadingSpinner size="sm" /> : <><Banknote className="w-4 h-4 mr-2" />管理员释放资金</>}
                  </Button>
                )}

                {displayRecord.status === 'disputed' && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm">
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                    <span>该交易存在纠纷，平台正在介入处理</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

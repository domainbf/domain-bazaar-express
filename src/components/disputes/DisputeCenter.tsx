import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';
import { AlertTriangle, Shield, CheckCircle, Clock, FileText } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Link } from 'react-router-dom';

interface Dispute {
  id: string;
  transaction_id: string | null;
  domain_id: string | null;
  initiator_id: string | null;
  respondent_id: string | null;
  reason: string;
  description: string | null;
  status: string | null;
  admin_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  domain?: { name: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
  open: { label: '待处理', variant: 'destructive', icon: AlertTriangle },
  under_review: { label: '审核中', variant: 'secondary', icon: Clock },
  resolved_buyer: { label: '已解决(买家)', variant: 'default', icon: CheckCircle },
  resolved_seller: { label: '已解决(卖家)', variant: 'default', icon: CheckCircle },
  resolved_split: { label: '协商解决', variant: 'default', icon: CheckCircle },
  closed: { label: '已关闭', variant: 'outline', icon: Shield },
};

interface DisputeCenterProps {
  isAdmin?: boolean;
}

export const DisputeCenter = ({ isAdmin = false }: DisputeCenterProps) => {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadDisputes();
  }, [isAdmin]);

  const loadDisputes = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('disputes')
        .select('*, domain:domain_listings(name)')
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        query = query.or(`initiator_id.eq.${user?.id},respondent_id.eq.${user?.id}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDisputes((data ?? []) as unknown as Dispute[]);
    } catch {
      toast.error('加载纠纷记录失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminResolve = async (resolution: string) => {
    if (!selectedDispute) return;
    setIsUpdating(true);
    try {
      await supabase.from('disputes').update({
        status: resolution,
        admin_notes: adminNotes,
        resolved_at: new Date().toISOString(),
      }).eq('id', selectedDispute.id);

      if (selectedDispute.transaction_id) {
        const newTxStatus = resolution === 'closed' ? 'cancelled' : 'completed';
        await supabase.from('transactions').update({
          status: newTxStatus,
          updated_at: new Date().toISOString(),
        }).eq('id', selectedDispute.transaction_id);
      }

      const notifyIds = [selectedDispute.initiator_id, selectedDispute.respondent_id].filter(Boolean) as string[];
      const resLabel = STATUS_CONFIG[resolution]?.label ?? resolution;
      await Promise.all(notifyIds.map(uid =>
        supabase.from('notifications').insert({
          user_id: uid,
          type: 'dispute_resolved',
          title: '纠纷已处理',
          message: `您的纠纷申诉已处理：${resLabel}`,
          data: { dispute_id: selectedDispute.id },
        })
      ));

      toast.success('纠纷已处理');
      setSelectedDispute(null);
      loadDisputes();
    } catch {
      toast.error('操作失败');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><LoadingSpinner /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          {isAdmin ? '所有纠纷申诉' : '我的纠纷申诉'}
        </h3>
        <Badge variant="secondary">{disputes.length} 条记录</Badge>
      </div>

      {disputes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">暂无纠纷记录</p>
          <p className="text-sm mt-1">良好的交易记录，继续保持！</p>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map(dispute => {
            const config = STATUS_CONFIG[dispute.status ?? 'open'];
            const StatusIcon = config?.icon ?? Clock;
            return (
              <Card
                key={dispute.id}
                className="hover:border-primary/40 transition-colors cursor-pointer"
                onClick={() => { setSelectedDispute(dispute); setAdminNotes(dispute.admin_notes ?? ''); }}
                data-testid={`dispute-card-${dispute.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{(dispute.domain as { name: string } | null)?.name ?? '未知域名'}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{dispute.reason}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(dispute.created_at).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    <Badge variant={config?.variant ?? 'secondary'} className="shrink-0">
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {config?.label ?? dispute.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dispute Detail Dialog */}
      <Dialog open={!!selectedDispute} onOpenChange={() => setSelectedDispute(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>纠纷详情</DialogTitle>
          </DialogHeader>
          {selectedDispute && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">域名</p>
                  <p className="font-medium">{(selectedDispute.domain as { name: string } | null)?.name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">状态</p>
                  <Badge variant={STATUS_CONFIG[selectedDispute.status ?? 'open']?.variant ?? 'secondary'} className="mt-0.5">
                    {STATUS_CONFIG[selectedDispute.status ?? 'open']?.label ?? selectedDispute.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">发起时间</p>
                  <p className="font-medium">{new Date(selectedDispute.created_at).toLocaleString('zh-CN')}</p>
                </div>
                {selectedDispute.transaction_id && (
                  <div>
                    <p className="text-muted-foreground text-xs">关联交易</p>
                    <Link to={`/transaction/${selectedDispute.transaction_id}`} className="text-primary text-xs hover:underline">
                      查看交易
                    </Link>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium mb-1">纠纷原因</p>
                <p className="text-sm text-muted-foreground p-3 bg-muted/40 rounded-lg">{selectedDispute.reason}</p>
              </div>

              {selectedDispute.description && (
                <div>
                  <p className="text-sm font-medium mb-1">详细描述</p>
                  <p className="text-sm text-muted-foreground p-3 bg-muted/40 rounded-lg whitespace-pre-wrap">{selectedDispute.description}</p>
                </div>
              )}

              {selectedDispute.admin_notes && !isAdmin && (
                <div>
                  <p className="text-sm font-medium mb-1 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-primary" /> 平台处理意见
                  </p>
                  <p className="text-sm text-muted-foreground p-3 bg-primary/5 border border-primary/20 rounded-lg">{selectedDispute.admin_notes}</p>
                </div>
              )}

              {isAdmin && ['open', 'under_review'].includes(selectedDispute.status ?? '') && (
                <div>
                  <p className="text-sm font-medium mb-1">处理意见</p>
                  <Textarea
                    placeholder="输入处理意见（将通知买卖双方）"
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    rows={3}
                    data-testid="input-admin-notes"
                  />
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAdminResolve('under_review')}
                      disabled={isUpdating}
                    >
                      标记审核中
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAdminResolve('resolved_buyer')}
                      disabled={isUpdating}
                      data-testid="button-resolve-buyer"
                    >
                      支持买家
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAdminResolve('resolved_seller')}
                      disabled={isUpdating}
                      data-testid="button-resolve-seller"
                    >
                      支持卖家
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAdminResolve('closed')}
                      disabled={isUpdating}
                      data-testid="button-close-dispute"
                    >
                      关闭纠纷
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDispute(null)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Fix: add Globe import
function Globe({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

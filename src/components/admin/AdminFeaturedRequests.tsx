import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, X, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FEATURED_REQUESTS_KEY, FeaturedRequestStatus, useFeaturedRealtimeSync, useFeaturedRequestQueue,
} from '@/hooks/useFeaturedRequests';

const STATUS_META: Record<FeaturedRequestStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  pending: { label: '待审核', variant: 'secondary' },
  approved: { label: '已通过', variant: 'default' },
  rejected: { label: '已拒绝', variant: 'destructive' },
};

export const AdminFeaturedRequests = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<FeaturedRequestStatus | 'all'>('pending');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  useFeaturedRealtimeSync();
  const { data: rows = [], isLoading, refetch } = useFeaturedRequestQueue(tab);

  const review = async (id: string, status: 'approved' | 'rejected') => {
    setBusyId(id);
    try {
      const { error } = await (supabase as any)
        .from('featured_requests')
        .update({
          status,
          reviewer_id: user?.id ?? null,
          review_note: notes[id]?.trim() || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) { toast.error(`操作失败：${error.message}`); return; }
      toast.success(status === 'approved' ? '已通过，域名已进入精选位' : '已拒绝，申请人将收到通知');
      queryClient.invalidateQueries({ queryKey: FEATURED_REQUESTS_KEY });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          精选域名审核队列
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" /> 刷新
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as FeaturedRequestStatus | 'all')}>
          <TabsList>
            <TabsTrigger value="pending">待审核</TabsTrigger>
            <TabsTrigger value="approved">已通过</TabsTrigger>
            <TabsTrigger value="rejected">已拒绝</TabsTrigger>
            <TabsTrigger value="all">全部</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-muted/50" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">暂无精选申请</p>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="rounded-lg border border-border p-4" data-testid={`featured-request-${r.id}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="break-all font-semibold">{r.domain_name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      提交于 {new Date(r.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <Badge variant={STATUS_META[r.status]?.variant ?? 'secondary'}>
                    {STATUS_META[r.status]?.label ?? r.status}
                  </Badge>
                </div>

                {r.reason && <p className="mt-3 text-sm text-muted-foreground">申请说明：{r.reason}</p>}
                {r.status !== 'pending' && r.review_note && (
                  <p className="mt-2 text-xs text-muted-foreground">审核备注：{r.review_note}</p>
                )}

                {r.status === 'pending' && (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Input
                      value={notes[r.id] ?? ''}
                      onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                      placeholder="审核备注（拒绝时建议填写）"
                      className="sm:flex-1"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => review(r.id, 'approved')} disabled={busyId === r.id}>
                        {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        通过
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive" onClick={() => review(r.id, 'rejected')} disabled={busyId === r.id}>
                        <X className="h-4 w-4" /> 拒绝
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

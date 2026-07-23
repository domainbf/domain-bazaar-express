import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { DisputeDetailDialog } from '@/components/disputes/DisputeDetailDialog';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

const STATUS: Record<string, { label: string; tone: any }> = {
  open: { label: '待受理', tone: 'secondary' },
  in_review: { label: '审核中', tone: 'default' },
  resolved_buyer: { label: '支持申诉方', tone: 'default' },
  resolved_seller: { label: '支持被申诉方', tone: 'outline' },
  closed: { label: '已关闭', tone: 'outline' },
};

export function AdminDisputes() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [selected, setSelected] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('disputes').select('*').order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  useRealtimeSubscription(['disputes'], () => load(), true);

  const filtered = filter === 'all' ? rows : rows.filter((r) => r.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><ShieldAlert className="w-5 h-5" /> 纠纷仲裁</h2>
          <p className="text-sm text-muted-foreground mt-1">查看用户申诉，审阅双方证据并作出裁决。</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4 mr-1.5" /> 刷新</Button>
      </div>
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="open">待受理 ({rows.filter(r => r.status === 'open').length})</TabsTrigger>
          <TabsTrigger value="in_review">审核中 ({rows.filter(r => r.status === 'in_review').length})</TabsTrigger>
          <TabsTrigger value="resolved_buyer">支持申诉方</TabsTrigger>
          <TabsTrigger value="resolved_seller">支持被申诉方</TabsTrigger>
          <TabsTrigger value="all">全部</TabsTrigger>
        </TabsList>
      </Tabs>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">申诉列表 ({filtered.length})</CardTitle></CardHeader>
        <CardContent className="p-0 divide-y">
          {loading ? <div className="p-8 text-center text-sm text-muted-foreground">加载中…</div> :
            filtered.length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">暂无记录</div> :
            filtered.map((r) => {
              const meta = STATUS[r.status] || { label: r.status, tone: 'outline' as const };
              return (
                <button key={r.id} onClick={() => setSelected(r)} className="w-full text-left px-4 py-3 hover:bg-muted/40">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{r.reason}</div>
                      <div className="text-xs text-muted-foreground truncate">{r.description?.slice(0, 80)}</div>
                    </div>
                    <Badge variant={meta.tone}>{meta.label}</Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {new Date(r.created_at).toLocaleString('zh-CN')}
                  </div>
                </button>
              );
            })}
        </CardContent>
      </Card>
      <DisputeDetailDialog dispute={selected} currentUserId={user?.id} isAdmin onClose={() => setSelected(null)} onUpdated={load} />
    </div>
  );
}

export default AdminDisputes;

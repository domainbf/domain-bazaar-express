import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ScrollText, RefreshCw, Search, Eye, Download } from 'lucide-react';

interface AuditLog {
  id: string;
  offer_id: string | null;
  domain_id: string | null;
  buyer_id: string | null;
  seller_id: string | null;
  event_type: string;
  idempotency_key: string | null;
  email_status: string | null;
  email_error: string | null;
  rollback_reason: string | null;
  duplicate_of: string | null;
  amount: number | null;
  currency: string | null;
  contact_email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: any;
  created_at: string;
}

const EVENT_LABELS: Record<string, string> = {
  submitted: '提交成功',
  duplicate_hit: '重复命中',
  email_sent: '邮件发送',
  email_failed: '邮件失败',
  rolled_back: '已回滚',
  validation_failed: '校验失败',
};

const EVENT_COLORS: Record<string, string> = {
  submitted: 'bg-green-500/15 text-green-600',
  duplicate_hit: 'bg-yellow-500/15 text-yellow-600',
  email_sent: 'bg-blue-500/15 text-blue-600',
  email_failed: 'bg-red-500/15 text-red-600',
  rolled_back: 'bg-orange-500/15 text-orange-600',
  validation_failed: 'bg-muted text-muted-foreground',
};

export const AdminAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('offer_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      setLogs((data as AuditLog[]) || []);
    } catch (err: any) {
      toast.error('加载审计日志失败：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const fromTs = dateFrom ? new Date(dateFrom).getTime() : 0;
    const toTs = dateTo ? new Date(dateTo).getTime() + 86400000 : Infinity;
    return logs.filter(l => {
      const matchEvent = eventFilter === 'all' || l.event_type === eventFilter;
      const kw = search.trim().toLowerCase();
      const matchKw = !kw ||
        (l.contact_email || '').toLowerCase().includes(kw) ||
        (l.idempotency_key || '').toLowerCase().includes(kw) ||
        (l.offer_id || '').toLowerCase().includes(kw);
      const ts = new Date(l.created_at).getTime();
      const matchDate = ts >= fromTs && ts <= toTs;
      return matchEvent && matchKw && matchDate;
    });
  }, [logs, search, eventFilter, dateFrom, dateTo]);

  const stats = useMemo(() => ({
    total: logs.length,
    duplicates: logs.filter(l => l.event_type === 'duplicate_hit').length,
    emailFailed: logs.filter(l => l.event_type === 'email_failed').length,
    rolledBack: logs.filter(l => l.event_type === 'rolled_back').length,
  }), [logs]);

  const exportCsv = () => {
    const rows = filtered.map(l => ({
      时间: new Date(l.created_at).toLocaleString(),
      事件: EVENT_LABELS[l.event_type] || l.event_type,
      报价ID: l.offer_id || '',
      联系邮箱: l.contact_email || '',
      金额: l.amount || '',
      货币: l.currency || '',
      幂等键: l.idempotency_key || '',
      重复源: l.duplicate_of || '',
      邮件状态: l.email_status || '',
      邮件错误: l.email_error || '',
      回滚原因: l.rollback_reason || '',
      IP: l.ip_address || '',
      UA: l.user_agent || '',
    }));
    const headers = Object.keys(rows[0] || {}).join(',');
    const csvBody = rows.map(r => Object.values(r).map(v => {
      const s = String(v || '').replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    }).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + headers + '\n' + csvBody], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('已导出');
  };

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">总日志</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-yellow-600">{stats.duplicates}</p><p className="text-xs text-muted-foreground">重复命中</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{stats.emailFailed}</p><p className="text-xs text-muted-foreground">邮件失败</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-orange-600">{stats.rolledBack}</p><p className="text-xs text-muted-foreground">已回滚</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2"><ScrollText className="h-5 w-5" />报价审计日志</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-2" />导出CSV</Button>
              <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />刷新</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-[240px] flex gap-2 items-center">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="邮箱/幂等键/报价ID" value={search} onChange={e => setSearch(e.target.value)} aria-label="搜索日志" />
            </div>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" aria-label="起始日期" />
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" aria-label="结束日期" />
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-40" aria-label="事件筛选"><SelectValue placeholder="事件类型" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部事件</SelectItem>
                {Object.entries(EVENT_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(dateFrom || dateTo) && (
              <Button variant="ghost" size="sm" onClick={() => { setDateFrom(''); setDateTo(''); }}>清除日期</Button>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">时间</th>
                  <th className="text-left p-3 font-medium">事件</th>
                  <th className="text-left p-3 font-medium">联系邮箱</th>
                  <th className="text-left p-3 font-medium">金额</th>
                  <th className="text-left p-3 font-medium">幂等键</th>
                  <th className="text-left p-3 font-medium">IP</th>
                  <th className="text-right p-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">暂无日志</td></tr>
                ) : filtered.map(l => (
                  <tr key={l.id} className="border-t hover:bg-muted/30">
                    <td className="p-3 whitespace-nowrap text-xs">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${EVENT_COLORS[l.event_type] || 'bg-muted'}`}>
                        {EVENT_LABELS[l.event_type] || l.event_type}
                      </span>
                    </td>
                    <td className="p-3 text-xs">{l.contact_email || '—'}</td>
                    <td className="p-3 text-xs">{l.amount ? `${l.currency || '¥'} ${Number(l.amount).toLocaleString()}` : '—'}</td>
                    <td className="p-3 text-xs font-mono text-muted-foreground max-w-[160px] truncate" title={l.idempotency_key || ''}>{l.idempotency_key || '—'}</td>
                    <td className="p-3 text-xs">{l.ip_address || '—'}</td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelected(l)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>审计日志详情</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              {[
                ['事件', EVENT_LABELS[selected.event_type] || selected.event_type],
                ['时间', new Date(selected.created_at).toLocaleString()],
                ['报价ID', selected.offer_id],
                ['域名ID', selected.domain_id],
                ['买家ID', selected.buyer_id],
                ['卖家ID', selected.seller_id],
                ['联系邮箱', selected.contact_email],
                ['金额', selected.amount ? `${selected.currency} ${selected.amount}` : null],
                ['幂等键', selected.idempotency_key],
                ['重复源报价', selected.duplicate_of],
                ['邮件状态', selected.email_status],
                ['邮件错误', selected.email_error],
                ['回滚原因', selected.rollback_reason],
                ['IP地址', selected.ip_address],
                ['User-Agent', selected.user_agent],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k as string} className="grid grid-cols-3 gap-2 border-b pb-2">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="col-span-2 font-mono text-xs break-all">{v as string}</span>
                </div>
              ))}
              {selected.metadata && Object.keys(selected.metadata).length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-1">元数据</p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">{JSON.stringify(selected.metadata, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAuditLogs;

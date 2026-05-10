import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Loader2, Globe, Users, MessageSquare, DollarSign } from 'lucide-react';

type EntityKey = 'domains' | 'users' | 'offers' | 'transactions';

interface Result {
  domains: any[];
  users: any[];
  offers: any[];
  transactions: any[];
}

const empty: Result = { domains: [], users: [], offers: [], transactions: [] };

const toCsv = (rows: any[]) => {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    if (v == null) return '';
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n');
};

const downloadCsv = (filename: string, rows: any[]) => {
  if (!rows.length) {
    toast.error('没有可导出的数据');
    return;
  }
  const blob = new Blob(['\ufeff' + toCsv(rows)], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  toast.success(`已导出 ${rows.length} 条记录`);
};

export const AdminUnifiedSearch = () => {
  const [keyword, setKeyword] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result>(empty);
  const [tab, setTab] = useState<EntityKey>('domains');

  const handleSearch = async () => {
    setLoading(true);
    try {
      const kw = keyword.trim();
      const fromIso = from ? new Date(from).toISOString() : null;
      const toIso = to ? new Date(to + 'T23:59:59').toISOString() : null;

      const applyDate = (q: any) => {
        if (fromIso) q = q.gte('created_at', fromIso);
        if (toIso) q = q.lte('created_at', toIso);
        return q;
      };

      const [d, u, o, t] = await Promise.all([
        applyDate(
          (kw
            ? supabase.from('domain_listings').select('*').or(`name.ilike.%${kw}%,description.ilike.%${kw}%`)
            : supabase.from('domain_listings').select('*'))
        ).order('created_at', { ascending: false }).limit(500),
        applyDate(
          (kw
            ? supabase.from('profiles').select('*').or(`username.ilike.%${kw}%,full_name.ilike.%${kw}%,contact_email.ilike.%${kw}%`)
            : supabase.from('profiles').select('*'))
        ).order('created_at', { ascending: false }).limit(500),
        applyDate(
          (kw
            ? supabase.from('domain_offers').select('*').or(`contact_email.ilike.%${kw}%,message.ilike.%${kw}%`)
            : supabase.from('domain_offers').select('*'))
        ).order('created_at', { ascending: false }).limit(500),
        applyDate(
          (kw
            ? supabase.from('payment_transactions').select('*').or(`gateway.ilike.%${kw}%,status.ilike.%${kw}%,gateway_transaction_id.ilike.%${kw}%`)
            : supabase.from('payment_transactions').select('*'))
        ).order('created_at', { ascending: false }).limit(500),
      ]);

      setResults({
        domains: d.data || [],
        users: u.data || [],
        offers: o.data || [],
        transactions: t.data || [],
      });
    } catch (err: any) {
      toast.error('搜索失败：' + (err.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const counts = useMemo(() => ({
    domains: results.domains.length,
    users: results.users.length,
    offers: results.offers.length,
    transactions: results.transactions.length,
  }), [results]);

  const renderTable = (rows: any[], cols: { key: string; label: string; render?: (v: any, r: any) => any }[]) => (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            {cols.map(c => (
              <th key={c.key} className="text-left p-3 font-medium whitespace-nowrap">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={cols.length} className="text-center py-8 text-muted-foreground">暂无数据</td></tr>
          ) : rows.slice(0, 200).map((r, i) => (
            <tr key={r.id || i} className="border-t hover:bg-muted/30">
              {cols.map(c => (
                <td key={c.key} className="p-3 align-top">{c.render ? c.render(r[c.key], r) : (r[c.key] ?? '—')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 200 && (
        <div className="p-3 text-center text-xs text-muted-foreground border-t">
          仅显示前 200 条，共 {rows.length} 条。导出CSV可下载全部。
        </div>
      )}
    </div>
  );

  const fmt = (v: any) => v ? new Date(v).toLocaleString() : '—';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />统一搜索 & 数据导出
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label className="text-xs">关键词</Label>
              <Input
                placeholder="域名/邮箱/留言/交易号..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div>
              <Label className="text-xs">起始日期</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">结束日期</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              搜索全部
            </Button>
            <Button variant="outline" onClick={() => { setKeyword(''); setFrom(''); setTo(''); setResults(empty); }}>
              重置
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as EntityKey)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="domains"><Globe className="h-4 w-4 mr-1" />域名 <Badge variant="secondary" className="ml-2">{counts.domains}</Badge></TabsTrigger>
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-1" />用户 <Badge variant="secondary" className="ml-2">{counts.users}</Badge></TabsTrigger>
          <TabsTrigger value="offers"><MessageSquare className="h-4 w-4 mr-1" />报价 <Badge variant="secondary" className="ml-2">{counts.offers}</Badge></TabsTrigger>
          <TabsTrigger value="transactions"><DollarSign className="h-4 w-4 mr-1" />订单 <Badge variant="secondary" className="ml-2">{counts.transactions}</Badge></TabsTrigger>
        </TabsList>

        <div className="flex justify-end mt-4 mb-2">
          <Button size="sm" variant="outline" onClick={() => downloadCsv(`${tab}_${new Date().toISOString().split('T')[0]}.csv`, results[tab])}>
            <Download className="h-4 w-4 mr-2" />导出当前 {tab} CSV
          </Button>
        </div>

        <TabsContent value="domains">
          {renderTable(results.domains, [
            { key: 'name', label: '域名' },
            { key: 'price', label: '价格', render: (v) => `¥${Number(v || 0).toLocaleString()}` },
            { key: 'status', label: '状态' },
            { key: 'category', label: '分类' },
            { key: 'verification_status', label: '验证' },
            { key: 'created_at', label: '创建时间', render: fmt },
          ])}
        </TabsContent>
        <TabsContent value="users">
          {renderTable(results.users, [
            { key: 'username', label: '用户名' },
            { key: 'full_name', label: '姓名' },
            { key: 'contact_email', label: '邮箱' },
            { key: 'is_seller', label: '卖家', render: (v) => v ? '是' : '否' },
            { key: 'seller_verified', label: '已验证', render: (v) => v ? '是' : '否' },
            { key: 'created_at', label: '注册时间', render: fmt },
          ])}
        </TabsContent>
        <TabsContent value="offers">
          {renderTable(results.offers, [
            { key: 'amount', label: '金额', render: (v, r) => `${r.currency || '¥'} ${Number(v || 0).toLocaleString()}` },
            { key: 'contact_email', label: '联系邮箱' },
            { key: 'status', label: '状态' },
            { key: 'duplicate_count', label: '重复次数' },
            { key: 'message', label: '留言', render: (v) => <span className="line-clamp-2 max-w-xs">{v || '—'}</span> },
            { key: 'created_at', label: '提交时间', render: fmt },
          ])}
        </TabsContent>
        <TabsContent value="transactions">
          {renderTable(results.transactions, [
            { key: 'gateway_transaction_id', label: '交易号' },
            { key: 'amount', label: '金额', render: (v, r) => `${r.currency || '¥'} ${Number(v || 0).toLocaleString()}` },
            { key: 'gateway', label: '渠道' },
            { key: 'status', label: '状态' },
            { key: 'fee', label: '手续费' },
            { key: 'created_at', label: '创建时间', render: fmt },
          ])}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminUnifiedSearch;

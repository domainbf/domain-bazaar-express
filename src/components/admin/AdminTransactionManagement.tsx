import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { RefreshCw, Search, Eye, CheckCircle, XCircle, AlertTriangle, DollarSign, Clock, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { buildEmail, infoTable, amountBlock } from '@/lib/emailTemplate';

interface AdminTransaction {
  id: string;
  amount: number;
  status: string;
  commission_amount: number | null;
  commission_rate: number | null;
  seller_amount: number | null;
  payment_method: string;
  created_at: string;
  completed_at: string | null;
  buyer_id: string | null;
  seller_id: string | null;
  domain_id: string;
  offer_id: string | null;
  notes: string | null;
  buyer_email?: string;
  seller_email?: string;
  domain_name?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 dark:bg-yellow-900/30 dark:text-yellow-400',
  paid: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 dark:bg-blue-900/30 dark:text-blue-400',
  in_escrow: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 dark:bg-purple-900/30 dark:text-purple-400',
  domain_transferred: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  completed: 'bg-green-500/15 text-green-600 dark:text-green-400 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-muted text-foreground dark:bg-gray-900/30 dark:text-muted-foreground',
  disputed: 'bg-red-500/15 text-red-600 dark:text-red-400 dark:bg-red-900/30 dark:text-red-400',
  refunded: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

const STATUS_LABELS: Record<string, string> = {
  pending: '等待付款', paid: '已付款', in_escrow: '托管中',
  domain_transferred: '域名已转移', completed: '已完成',
  cancelled: '已取消', disputed: '纠纷中', refunded: '已退款',
};

export const AdminTransactionManagement = () => {
  const { config } = useSiteSettings();
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTx, setSelectedTx] = useState<AdminTransaction | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [actionNote, setActionNote] = useState('');
  const [isActing, setIsActing] = useState(false);

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id, amount, status, commission_amount, commission_rate, seller_amount,
          payment_method, created_at, completed_at, buyer_id, seller_id,
          domain_id, offer_id, notes,
          domain_listings:domain_id ( name )
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      const txs = data || [];
      const buyerIds = [...new Set(txs.map((t: any) => t.buyer_id).filter(Boolean))];
      const sellerIds = [...new Set(txs.map((t: any) => t.seller_id).filter(Boolean))];
      const allIds = [...new Set([...buyerIds, ...sellerIds])];

      let profiles: any[] = [];
      if (allIds.length > 0) {
        const { data: p } = await supabase
          .from('profiles')
          .select('id, contact_email, full_name')
          .in('id', allIds);
        profiles = p || [];
      }

      const profileMap = Object.fromEntries(profiles.map((p: any) => [p.id, p]));

      const mapped: AdminTransaction[] = txs.map((t: any) => ({
        ...t,
        domain_name: t.domain_listings?.name ?? '—',
        buyer_email: profileMap[t.buyer_id]?.contact_email ?? profileMap[t.buyer_id]?.full_name ?? '—',
        seller_email: profileMap[t.seller_id]?.contact_email ?? profileMap[t.seller_id]?.full_name ?? '—',
      }));

      setTransactions(mapped);
    } catch (err: any) {
      toast.error('加载交易记录失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const handleStatusUpdate = async (txId: string, newStatus: string) => {
    setIsActing(true);
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'completed') updates.completed_at = new Date().toISOString();
      if (actionNote) updates.notes = actionNote;

      const { error } = await supabase.from('transactions').update(updates).eq('id', txId);
      if (error) throw error;

      // Sync domain listing status when transaction reaches a terminal state
      if (selectedTx?.domain_id) {
        if (newStatus === 'completed') {
          await supabase.from('domain_listings')
            .update({ status: 'sold', updated_at: new Date().toISOString() })
            .eq('id', selectedTx.domain_id);
        } else if (newStatus === 'cancelled' || newStatus === 'refunded') {
          await supabase.from('domain_listings')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('id', selectedTx.domain_id);
        }
      }

      // Send email notifications based on the new status
      if (selectedTx) {
        const brand = {
          siteName: config.site_name || '域见•你',
          siteHostname: (config.site_domain || window.location.origin).replace(/^https?:\/\//, '').toUpperCase(),
          siteDomain: config.site_domain || window.location.origin,
          supportEmail: config.contact_email || 'support@nic.rw',
        };
        const domainName = (selectedTx.domain_name || '').toUpperCase() || '域名';
        const txUrl = `${brand.siteDomain}/user-center?tab=transactions`;
        const fmtAmount = `¥${Number(selectedTx.amount || 0).toLocaleString()}`;
        const fmtSeller = selectedTx.seller_amount != null ? `¥${Number(selectedTx.seller_amount).toLocaleString()}` : fmtAmount;
        const txInfo = infoTable([
          { label: '交易编号', value: txId.substring(0, 8).toUpperCase() },
          { label: '域名', value: domainName, highlight: true },
          { label: '交易金额', value: fmtAmount, highlight: true },
          { label: '状态', value: STATUS_LABELS[newStatus] || newStatus },
          ...(actionNote ? [{ label: '管理员备注', value: actionNote }] : []),
        ]);

        const sendTxEmail = (to: string | null | undefined, subject: string, html: string) => {
          if (!to || !to.includes('@')) return;
          supabase.functions.invoke('send-email', { body: { to, subject, html } }).catch(() => {});
        };

        if (newStatus === 'in_escrow') {
          // Buyer: payment confirmed, funds in escrow
          sendTxEmail(selectedTx.buyer_email, `✅ 付款已确认：${domainName} 资金安全担保中`, buildEmail({
            previewText: `您的付款已确认，${domainName} 资金已进入安全担保`,
            accentColor: '#16a34a',
            headerEmoji: '🔒',
            title: '付款确认，资金安全担保',
            subtitle: `${domainName} 正在过户流程中`,
            body: `<p style="margin:0 0 20px;font-size:15px;color:#374151;">平台已确认收到您的付款，资金已进入安全担保账户，域名正在办理过户手续。</p>${txInfo}`,
            ctaLabel: '查看交易进度',
            ctaUrl: txUrl,
            brand,
          }));
          // Seller: buyer has paid
          sendTxEmail(selectedTx.seller_email, `💰 买家已付款：${domainName} 等待过户`, buildEmail({
            previewText: `买家已付款，${domainName} 资金已进入平台担保`,
            accentColor: '#0f172a',
            headerEmoji: '💰',
            title: '买家已付款，请配合过户',
            subtitle: `${domainName} 交易进入担保阶段`,
            body: `<p style="margin:0 0 20px;font-size:15px;color:#374151;">买家已完成付款，资金已由平台安全担保。请尽快配合完成域名过户，过户完成后款项将划入您的账户。</p>${txInfo}${amountBlock({ label: '您的到账金额', amount: fmtSeller, sublabel: '过户完成后结算', color: '#16a34a' })}`,
            ctaLabel: '查看交易详情',
            ctaUrl: txUrl,
            brand,
          }));
        } else if (newStatus === 'domain_transferred') {
          // Buyer: domain transferred, please confirm
          sendTxEmail(selectedTx.buyer_email, `📦 域名已转移：请确认接收 ${domainName}`, buildEmail({
            previewText: `${domainName} 域名已转移，请登录确认接收`,
            accentColor: '#7c3aed',
            headerEmoji: '📦',
            title: '域名已转移，请确认接收',
            subtitle: `请登录 ${brand.siteHostname} 确认域名已到账`,
            body: `<p style="margin:0 0 20px;font-size:15px;color:#374151;">卖家已完成域名转移，请登录平台确认域名已成功转入您的账户。确认无误后，款项将自动结算给卖家。</p>${txInfo}`,
            ctaLabel: '确认接收域名',
            ctaUrl: txUrl,
            brand,
          }));
        } else if (newStatus === 'completed') {
          // Buyer: transaction complete
          sendTxEmail(selectedTx.buyer_email, `🎉 交易完成：${domainName} 已归属您名下`, buildEmail({
            previewText: `恭喜！${domainName} 域名已完成过户，交易圆满成功`,
            accentColor: '#16a34a',
            headerEmoji: '🎉',
            title: '交易完成，域名到手！',
            subtitle: `${domainName} 已成功归属您名下`,
            body: `<p style="margin:0 0 20px;font-size:15px;color:#374151;">恭喜您！域名交易已圆满完成，${domainName} 已正式归属您名下。感谢您使用 ${brand.siteName} 平台。</p>${txInfo}`,
            ctaLabel: '查看我的域名',
            ctaUrl: txUrl,
            brand,
          }));
          // Seller: payment released
          sendTxEmail(selectedTx.seller_email, `💸 款项已到账：${domainName} 交易结算完成`, buildEmail({
            previewText: `${domainName} 交易完成，款项已划入您的账户`,
            accentColor: '#16a34a',
            headerEmoji: '💸',
            title: '款项已结算到账',
            subtitle: `${domainName} 交易圆满完成`,
            body: `<p style="margin:0 0 20px;font-size:15px;color:#374151;">域名交易已完成，扣除平台手续费后的款项已划入您的账户。感谢您使用 ${brand.siteName} 平台进行域名出售。</p>${txInfo}${amountBlock({ label: '结算金额', amount: fmtSeller, sublabel: '已扣除平台手续费', color: '#16a34a' })}`,
            ctaLabel: '查看交易记录',
            ctaUrl: txUrl,
            brand,
          }));
        } else if (newStatus === 'cancelled') {
          // Both: cancellation notice
          const cancelHtml = buildEmail({
            previewText: `${domainName} 交易已取消`,
            accentColor: '#94a3b8',
            headerEmoji: '❌',
            title: '交易已取消',
            subtitle: `${domainName} 交易已由平台取消`,
            body: `<p style="margin:0 0 20px;font-size:15px;color:#374151;">此次交易已由平台取消。如有疑问请联系客服。</p>${txInfo}`,
            ctaLabel: '联系客服',
            ctaUrl: `${brand.siteDomain}/support`,
            brand,
          });
          sendTxEmail(selectedTx.buyer_email, `交易已取消：${domainName}`, cancelHtml);
          sendTxEmail(selectedTx.seller_email, `交易已取消：${domainName}`, cancelHtml);
        } else if (newStatus === 'refunded') {
          sendTxEmail(selectedTx.buyer_email, `退款通知：${domainName} 交易款项退还中`, buildEmail({
            previewText: `${domainName} 交易退款已发起`,
            accentColor: '#f97316',
            headerEmoji: '↩️',
            title: '退款已发起',
            subtitle: `${fmtAmount} 将退还至您的原支付账户`,
            body: `<p style="margin:0 0 20px;font-size:15px;color:#374151;">平台已发起退款，款项将在 3-7 个工作日内退还至您的原支付账户，请注意查收。</p>${txInfo}`,
            ctaLabel: '查看退款状态',
            ctaUrl: txUrl,
            brand,
          }));
        }
      }

      toast.success(`交易状态已更新为：${STATUS_LABELS[newStatus]}`);
      setShowDetail(false);
      setActionNote('');
      loadTransactions();
    } catch (err: any) {
      toast.error('状态更新失败');
    } finally {
      setIsActing(false);
    }
  };

  const filtered = transactions.filter(t => {
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const s = search.toLowerCase();
    const matchSearch = !s || t.domain_name?.toLowerCase().includes(s) || t.buyer_email?.toLowerCase().includes(s) || t.seller_email?.toLowerCase().includes(s) || t.id.includes(s);
    return matchStatus && matchSearch;
  });

  const stats = {
    total: transactions.length,
    completed: transactions.filter(t => t.status === 'completed').length,
    pending: transactions.filter(t => ['pending', 'paid', 'in_escrow'].includes(t.status)).length,
    disputed: transactions.filter(t => t.status === 'disputed').length,
    totalRevenue: transactions.filter(t => t.status === 'completed').reduce((s, t) => s + (t.commission_amount ?? 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">交易管理</h2>
          <p className="text-sm text-muted-foreground">管理平台上的所有买卖交易</p>
        </div>
        <Button onClick={loadTransactions} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />刷新
        </Button>
      </div>

      {/* 统计行 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: '全部交易', value: stats.total, color: 'text-foreground' },
          { label: '已完成', value: stats.completed, color: 'text-green-600' },
          { label: '进行中', value: stats.pending, color: 'text-blue-600' },
          { label: '纠纷中', value: stats.disputed, color: 'text-red-600' },
          { label: '平台手续费', value: `¥${stats.totalRevenue.toLocaleString()}`, color: 'text-orange-600' },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 过滤器 */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="搜索域名、买家或卖家..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="状态筛选" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 交易表格 */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-10"><LoadingSpinner /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">暂无交易记录</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>域名</TableHead>
                    <TableHead>买家</TableHead>
                    <TableHead>卖家</TableHead>
                    <TableHead className="text-right">金额</TableHead>
                    <TableHead className="text-right">手续费</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead className="text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(tx => (
                    <TableRow key={tx.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                          <Link to={`/domain/${tx.domain_name}`} className="font-medium hover:underline text-sm">{tx.domain_name}</Link>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-32 truncate">{tx.buyer_email}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-32 truncate">{tx.seller_email}</TableCell>
                      <TableCell className="text-right font-semibold">¥{Number(tx.amount).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm text-orange-600">
                        {tx.commission_amount ? `¥${Number(tx.commission_amount).toLocaleString()}` : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${STATUS_COLORS[tx.status] ?? ''}`}>
                          {STATUS_LABELS[tx.status] ?? tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString('zh-CN')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm" variant="ghost"
                          onClick={() => { setSelectedTx(tx); setShowDetail(true); }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 交易详情 Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>交易详情</DialogTitle>
          </DialogHeader>
          {selectedTx && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">交易ID：</span><span className="font-mono text-xs">{selectedTx.id.slice(0, 8)}...</span></div>
                <div><span className="text-muted-foreground">域名：</span><strong>{selectedTx.domain_name}</strong></div>
                <div><span className="text-muted-foreground">买家：</span>{selectedTx.buyer_email}</div>
                <div><span className="text-muted-foreground">卖家：</span>{selectedTx.seller_email}</div>
                <div><span className="text-muted-foreground">金额：</span><strong>¥{Number(selectedTx.amount).toLocaleString()}</strong></div>
                <div><span className="text-muted-foreground">手续费：</span>¥{Number(selectedTx.commission_amount ?? 0).toLocaleString()} ({selectedTx.commission_rate}%)</div>
                <div><span className="text-muted-foreground">卖家到手：</span>¥{Number(selectedTx.seller_amount ?? 0).toLocaleString()}</div>
                <div><span className="text-muted-foreground">支付方式：</span>{selectedTx.payment_method}</div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">当前状态：</span>
                  <Badge className={`ml-2 text-xs ${STATUS_COLORS[selectedTx.status] ?? ''}`}>
                    {STATUS_LABELS[selectedTx.status]}
                  </Badge>
                </div>
                {selectedTx.notes && (
                  <div className="col-span-2"><span className="text-muted-foreground">备注：</span>{selectedTx.notes}</div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">操作备注（可选）</label>
                <Textarea
                  className="mt-1"
                  placeholder="添加操作备注..."
                  value={actionNote}
                  onChange={e => setActionNote(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedTx.status === 'pending' && (
                  <Button size="sm" onClick={() => handleStatusUpdate(selectedTx.id, 'paid')} disabled={isActing}>
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />确认已付款
                  </Button>
                )}
                {selectedTx.status === 'paid' && (
                  <Button size="sm" onClick={() => handleStatusUpdate(selectedTx.id, 'in_escrow')} disabled={isActing}>
                    <Clock className="h-3.5 w-3.5 mr-1.5" />进入托管
                  </Button>
                )}
                {selectedTx.status === 'in_escrow' && (
                  <Button size="sm" onClick={() => handleStatusUpdate(selectedTx.id, 'domain_transferred')} disabled={isActing}>
                    <Globe className="h-3.5 w-3.5 mr-1.5" />确认域名已转移
                  </Button>
                )}
                {selectedTx.status === 'domain_transferred' && (
                  <Button size="sm" variant="default" onClick={() => handleStatusUpdate(selectedTx.id, 'completed')} disabled={isActing}>
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />标记为完成
                  </Button>
                )}
                {!['completed', 'cancelled', 'refunded', 'disputed'].includes(selectedTx.status) && (
                  <>
                    <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(selectedTx.id, 'disputed')} disabled={isActing}>
                      <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />标记纠纷
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(selectedTx.id, 'cancelled')} disabled={isActing}>
                      <XCircle className="h-3.5 w-3.5 mr-1.5" />取消交易
                    </Button>
                  </>
                )}
                {selectedTx.status === 'disputed' && (
                  <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(selectedTx.id, 'refunded')} disabled={isActing}>
                    已退款
                  </Button>
                )}
              </div>

              <Link to={`/transaction/${selectedTx.id}`} target="_blank">
                <Button variant="outline" size="sm" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />查看完整交易页面
                </Button>
              </Link>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetail(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

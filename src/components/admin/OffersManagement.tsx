import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { useState, useEffect } from 'react';
import { apiGet, apiPatch, apiDelete } from '@/lib/apiClient';
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, RefreshCw, Download, MoreHorizontal, Check, X, Clock, MessageSquare } from 'lucide-react';

interface Offer {
  id: string;
  amount: number;
  status: string | null;
  message: string | null;
  contact_email: string | null;
  created_at: string | null;
  updated_at: string | null;
  domain_id: string | null;
  buyer_id: string | null;
  seller_id: string | null;
  domain_name?: string;
  buyer_email?: string;
  seller_email?: string;
}

const statusLabels: Record<string, string> = {
  pending: '待处理', accepted: '已接受', rejected: '已拒绝', expired: '已过期', cancelled: '已取消',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  accepted: 'bg-green-500/15 text-green-600 dark:text-green-400',
  rejected: 'bg-red-500/15 text-red-600 dark:text-red-400',
  expired: 'bg-muted text-muted-foreground',
  cancelled: 'bg-muted text-muted-foreground',
};

export const OffersManagement = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadOffers();
  }, []);

  useRealtimeSubscription(
    ["domain_offers"],
    (_event) => { loadOffers(); }
  );

  const loadOffers = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<Offer[]>('/data/admin/offers');
      setOffers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error loading offers:', error);
      toast.error('加载报价失败');
    } finally {
      setIsLoading(false);
    }
  };

  const updateOfferStatus = async (offerId: string, status: string) => {
    try {
      await apiPatch(`/data/domain-offers/${offerId}`, { status });
      setOffers(offers.map(o => o.id === offerId ? { ...o, status } : o));
      toast.success(`报价状态已更新为: ${statusLabels[status] || status}`);
    } catch (error: any) {
      toast.error('更新失败: ' + error.message);
    }
  };

  const deleteOffer = async (offerId: string) => {
    if (!confirm('确定删除此报价记录？')) return;
    try {
      await apiDelete(`/data/domain-offers/${offerId}`);
      setOffers(offers.filter(o => o.id !== offerId));
      toast.success('报价已删除');
    } catch (error: any) {
      toast.error('删除失败: ' + error.message);
    }
  };

  const exportOffers = () => {
    const csv = [
      '域名,报价金额,买家邮箱,卖家邮箱,联系邮箱,状态,留言,时间',
      ...filteredOffers.map(o =>
        [o.domain_name, o.amount, o.buyer_email || '', o.seller_email || '', o.contact_email || '', statusLabels[o.status || ''] || o.status, (o.message || '').replace(/,/g, '，'), new Date(o.created_at || '').toLocaleString()].join(',')
      )
    ].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `offers_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('导出成功');
  };

  const filteredOffers = offers.filter(o => {
    const matchSearch = !searchQuery ||
      (o.domain_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.buyer_email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.contact_email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: offers.length,
    pending: offers.filter(o => o.status === 'pending').length,
    accepted: offers.filter(o => o.status === 'accepted').length,
    totalAmount: offers.reduce((s, o) => s + (o.amount || 0), 0),
  };

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">总报价数</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-yellow-600">{stats.pending}</p><p className="text-xs text-muted-foreground">待处理</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{stats.accepted}</p><p className="text-xs text-muted-foreground">已接受</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">¥{stats.totalAmount.toLocaleString()}</p><p className="text-xs text-muted-foreground">总报价金额</p></CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />报价管理
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportOffers}><Download className="h-4 w-4 mr-2" />导出CSV</Button>
          <Button size="sm" variant="outline" onClick={async () => { setIsRefreshing(true); await loadOffers(); setIsRefreshing(false); }} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />刷新
          </Button>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex-1 flex gap-2 items-center">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="搜索域名、买家邮箱..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="状态" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="pending">待处理</SelectItem>
            <SelectItem value="accepted">已接受</SelectItem>
            <SelectItem value="rejected">已拒绝</SelectItem>
            <SelectItem value="cancelled">已取消</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-4 font-medium">域名</th>
              <th className="text-left p-4 font-medium">报价金额</th>
              <th className="text-left p-4 font-medium">买家邮箱</th>
              <th className="text-left p-4 font-medium">卖家邮箱</th>
              <th className="text-left p-4 font-medium">联系邮箱</th>
              <th className="text-left p-4 font-medium">状态</th>
              <th className="text-left p-4 font-medium">留言</th>
              <th className="text-left p-4 font-medium">时间</th>
              <th className="text-left p-4 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredOffers.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">暂无报价记录</td></tr>
            ) : filteredOffers.map(offer => (
              <tr key={offer.id} className="border-b hover:bg-muted/30">
                <td className="p-4 font-medium">{offer.domain_name || '—'}</td>
                <td className="p-4 font-bold text-primary">¥{offer.amount?.toLocaleString()}</td>
                <td className="p-4 text-sm">{offer.buyer_email || '匿名'}</td>
                <td className="p-4 text-sm">{offer.seller_email || '—'}</td>
                <td className="p-4 text-sm text-muted-foreground">{offer.contact_email || '-'}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[offer.status || ''] || 'bg-muted text-muted-foreground'}`}>
                    {statusLabels[offer.status || ''] || offer.status}
                  </span>
                </td>
                <td className="p-4 text-sm text-muted-foreground max-w-[150px] truncate" title={offer.message || ''}>
                  {offer.message || '-'}
                </td>
                <td className="p-4 text-sm text-muted-foreground whitespace-nowrap">
                  {offer.created_at ? new Date(offer.created_at).toLocaleDateString() : '-'}
                </td>
                <td className="p-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {offer.status === 'pending' && (
                        <>
                          <DropdownMenuItem onClick={() => updateOfferStatus(offer.id, 'accepted')}>
                            <Check className="h-4 w-4 mr-2 text-green-600" />接受报价
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateOfferStatus(offer.id, 'rejected')}>
                            <X className="h-4 w-4 mr-2 text-red-600" />拒绝报价
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem onClick={() => updateOfferStatus(offer.id, 'pending')}>
                        <Clock className="h-4 w-4 mr-2" />重置为待处理
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteOffer(offer.id)} className="text-destructive">
                        <X className="h-4 w-4 mr-2" />删除记录
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

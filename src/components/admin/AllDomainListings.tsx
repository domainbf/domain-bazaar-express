import { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DomainListing } from '@/types/domain';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Star, Check, RefreshCw, Search, Download, Eye, Trash2, Edit, Globe, Filter, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const AllDomainListings = () => {
  const { t } = useTranslation();
  const [domains, setDomains] = useState<DomainListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [editingDomain, setEditingDomain] = useState<DomainListing | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    loadDomains();
    
    // 设置实时订阅
    const channel = supabase
      .channel('admin-domain-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'domain_listings',
        },
        (payload) => {
          console.log('Admin: Domain change detected', payload.eventType);
          loadDomains();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadDomains = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('domain_listings')
        .select(`
          *,
          domain_analytics(views, favorites, offers)
        `);
      
      if (error) throw error;
      
      // 获取所有者信息
      const ownerIds = [...new Set(data?.map(d => d.owner_id).filter(Boolean) || [])];
      let profilesMap: Record<string, { username?: string; full_name?: string; contact_email?: string }> = {};
      
      if (ownerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, full_name, contact_email')
          .in('id', ownerIds);
        
        if (profilesData) {
          profilesMap = profilesData.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {} as Record<string, { username?: string; full_name?: string; contact_email?: string }>);
        }
      }
      
      const processedDomains: DomainListing[] = data?.map(domain => {
        const analyticsData = domain.domain_analytics && Array.isArray(domain.domain_analytics) ? domain.domain_analytics[0] : null;
        const ownerData = domain.owner_id ? profilesMap[domain.owner_id] : null;
        
        let viewsValue = 0, favoritesValue = 0, offersValue = 0;
        
        if (analyticsData) {
          viewsValue = typeof analyticsData.views === 'number' ? analyticsData.views : parseInt(String(analyticsData.views), 10) || 0;
          favoritesValue = typeof analyticsData.favorites === 'number' ? analyticsData.favorites : parseInt(String(analyticsData.favorites), 10) || 0;
          offersValue = typeof analyticsData.offers === 'number' ? analyticsData.offers : parseInt(String(analyticsData.offers), 10) || 0;
        }
        
        let ownerName = '未知';
        let ownerEmail = '';
        if (ownerData && typeof ownerData === 'object') {
          ownerName = ownerData.username || ownerData.full_name || '未知';
          ownerEmail = ownerData.contact_email || '';
        }
        
        const { domain_analytics, ...rest } = domain;
        
        return {
          ...rest,
          views: viewsValue,
          favorites: favoritesValue,
          offers: offersValue,
          ownerName,
          ownerEmail
        };
      }) || [];
      
      setDomains(processedDomains);
    } catch (error: any) {
      console.error('Error loading domains:', error);
      toast.error('加载域名列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshDomains = async () => {
    setIsRefreshing(true);
    await loadDomains();
    setIsRefreshing(false);
    toast.success('数据已刷新');
  };

  const toggleHighlight = async (domain: DomainListing) => {
    try {
      const { error } = await supabase
        .from('domain_listings')
        .update({ highlight: !domain.highlight })
        .eq('id', domain.id);
      
      if (error) throw error;
      
      setDomains(domains.map(d => 
        d.id === domain.id ? { ...d, highlight: !domain.highlight } : d
      ));
      
      toast.success(domain.highlight ? '已取消推荐' : '已设为推荐');
    } catch (error: any) {
      console.error('Error toggling highlight:', error);
      toast.error('操作失败');
    }
  };

  const updateDomainStatus = async (domain: DomainListing, status: string) => {
    try {
      const { error } = await supabase
        .from('domain_listings')
        .update({ status })
        .eq('id', domain.id);
      
      if (error) throw error;
      
      setDomains(domains.map(d => 
        d.id === domain.id ? { ...d, status } : d
      ));
      
      toast.success(`状态已更新为: ${getStatusLabel(status)}`);
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('更新状态失败');
    }
  };

  const deleteDomain = async (domainId: string) => {
    if (!confirm('确定要删除这个域名吗？此操作不可撤销。')) return;
    
    try {
      const { error } = await supabase
        .from('domain_listings')
        .delete()
        .eq('id', domainId);
      
      if (error) throw error;
      
      setDomains(domains.filter(d => d.id !== domainId));
      toast.success('域名已删除');
    } catch (error: any) {
      console.error('Error deleting domain:', error);
      toast.error('删除失败');
    }
  };

  const handleEditDomain = async () => {
    if (!editingDomain) return;
    
    try {
      const { error } = await supabase
        .from('domain_listings')
        .update({
          name: editingDomain.name,
          price: editingDomain.price,
          description: editingDomain.description,
          category: editingDomain.category,
          status: editingDomain.status
        })
        .eq('id', editingDomain.id);
      
      if (error) throw error;
      
      setDomains(domains.map(d => d.id === editingDomain.id ? editingDomain : d));
      toast.success('域名信息已更新');
      setIsEditDialogOpen(false);
      setEditingDomain(null);
    } catch (error: any) {
      console.error('Error updating domain:', error);
      toast.error('更新失败');
    }
  };

  const exportDomains = () => {
    const csvData = filteredDomains.map(d => ({
      域名: d.name,
      价格: d.price,
      状态: getStatusLabel(d.status || ''),
      分类: getCategoryLabel(d.category || ''),
      验证状态: getVerificationLabel(d.verification_status || ''),
      浏览量: d.views || 0,
      收藏数: d.favorites || 0,
      报价数: d.offers || 0,
      创建时间: new Date(d.created_at).toLocaleDateString()
    }));

    const headers = Object.keys(csvData[0] || {}).join(',');
    const rows = csvData.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `domains_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success('导出成功');
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'available': '可售',
      'sold': '已售',
      'reserved': '保留',
      'pending': '待审核'
    };
    return labels[status] || status;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'premium': '高端',
      'standard': '标准',
      'short': '短域名',
      'numeric': '数字',
      'brandable': '品牌',
      'keyword': '关键词'
    };
    return labels[category] || category;
  };

  const getVerificationLabel = (status: string) => {
    const labels: Record<string, string> = {
      'verified': '已验证',
      'pending': '待验证',
      'none': '未验证'
    };
    return labels[status] || '未验证';
  };

  const filteredDomains = useMemo(() => {
    let result = domains.filter(domain => {
      const matchesSearch = 
        searchQuery === '' ||
        domain.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (domain.description && domain.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (domain.ownerName && domain.ownerName.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || domain.status === statusFilter;
      const matchesVerification = 
        verificationFilter === 'all' ||
        (verificationFilter === 'verified' && domain.verification_status === 'verified') ||
        (verificationFilter === 'pending' && domain.verification_status === 'pending') ||
        (verificationFilter === 'none' && (!domain.verification_status || domain.verification_status === 'none'));
      const matchesCategory = categoryFilter === 'all' || domain.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesVerification && matchesCategory;
    });

    // 排序
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return (a.price || 0) - (b.price || 0);
        case 'price_desc':
          return (b.price || 0) - (a.price || 0);
        case 'views':
          return (b.views || 0) - (a.views || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [domains, searchQuery, statusFilter, verificationFilter, categoryFilter, sortBy]);

  // 统计数据
  const stats = {
    total: domains.length,
    available: domains.filter(d => d.status === 'available').length,
    sold: domains.filter(d => d.status === 'sold').length,
    verified: domains.filter(d => d.verification_status === 'verified').length,
    totalValue: domains.reduce((sum, d) => sum + (d.price || 0), 0)
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部统计 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">总域名数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.available}</p>
            <p className="text-xs text-muted-foreground">可售</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.sold}</p>
            <p className="text-xs text-muted-foreground">已售</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.verified}</p>
            <p className="text-xs text-muted-foreground">已验证</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">¥{stats.totalValue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">总价值</p>
          </CardContent>
        </Card>
      </div>

      {/* 工具栏 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Globe className="h-5 w-5" />
          所有域名列表
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportDomains}>
            <Download className="h-4 w-4 mr-2" />
            导出CSV
          </Button>
          <Button size="sm" variant="outline" onClick={refreshDomains} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <div className="col-span-2 sm:col-span-1 lg:col-span-2 flex gap-2 items-center">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="搜索域名..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="available">可售</SelectItem>
            <SelectItem value="sold">已售</SelectItem>
            <SelectItem value="reserved">保留</SelectItem>
            <SelectItem value="pending">待审核</SelectItem>
          </SelectContent>
        </Select>

        <Select value={verificationFilter} onValueChange={setVerificationFilter}>
          <SelectTrigger>
            <SelectValue placeholder="验证状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="verified">已验证</SelectItem>
            <SelectItem value="pending">待验证</SelectItem>
            <SelectItem value="none">未验证</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger>
            <SelectValue placeholder="分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            <SelectItem value="premium">高端</SelectItem>
            <SelectItem value="standard">标准</SelectItem>
            <SelectItem value="short">短域名</SelectItem>
            <SelectItem value="numeric">数字</SelectItem>
            <SelectItem value="brandable">品牌</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue placeholder="排序" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">最新添加</SelectItem>
            <SelectItem value="price_desc">价格从高到低</SelectItem>
            <SelectItem value="price_asc">价格从低到高</SelectItem>
            <SelectItem value="views">浏览量</SelectItem>
            <SelectItem value="name">名称</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 域名表格 */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-4 font-medium">域名</th>
              <th className="text-left p-4 font-medium">价格</th>
              <th className="text-left p-4 font-medium">所有者</th>
              <th className="text-left p-4 font-medium">分类</th>
              <th className="text-left p-4 font-medium">状态</th>
              <th className="text-left p-4 font-medium">验证</th>
              <th className="text-left p-4 font-medium">统计</th>
              <th className="text-left p-4 font-medium">创建时间</th>
              <th className="text-left p-4 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredDomains.map((domain) => (
              <tr key={domain.id} className="border-b hover:bg-muted/30">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{domain.name}</span>
                    {domain.highlight && (
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    )}
                  </div>
                </td>
                <td className="p-4 font-medium">¥{domain.price?.toLocaleString()}</td>
                <td className="p-4 text-sm text-muted-foreground">{domain.ownerName}</td>
                <td className="p-4">
                  <Badge variant="outline">{getCategoryLabel(domain.category || 'standard')}</Badge>
                </td>
                <td className="p-4">
                  <Badge variant={domain.status === 'available' ? 'default' : domain.status === 'sold' ? 'secondary' : 'outline'}>
                    {getStatusLabel(domain.status || 'available')}
                  </Badge>
                </td>
                <td className="p-4">
                  {domain.verification_status === 'verified' ? (
                    <span className="inline-flex items-center text-green-600 text-sm">
                      <Check className="h-4 w-4 mr-1" />
                      已验证
                    </span>
                  ) : domain.verification_status === 'pending' ? (
                    <span className="text-yellow-600 text-sm">待验证</span>
                  ) : (
                    <span className="text-muted-foreground text-sm">未验证</span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex flex-col text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {domain.views || 0}</span>
                    <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {domain.offers || 0}报价</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-muted-foreground">
                  {new Date(domain.created_at).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setEditingDomain(domain);
                        setIsEditDialogOpen(true);
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        编辑
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleHighlight(domain)}>
                        <Star className="h-4 w-4 mr-2" />
                        {domain.highlight ? '取消推荐' : '设为推荐'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => updateDomainStatus(domain, 'available')}>
                        设为可售
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateDomainStatus(domain, 'sold')}>
                        标记已售
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateDomainStatus(domain, 'reserved')}>
                        设为保留
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={() => deleteDomain(domain.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredDomains.length === 0 && (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">没有找到符合条件的域名</p>
        </div>
      )}

      <div className="text-sm text-muted-foreground text-center">
        显示 {filteredDomains.length} / {domains.length} 个域名
      </div>

      {/* 编辑域名对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑域名</DialogTitle>
            <DialogDescription>修改域名信息</DialogDescription>
          </DialogHeader>
          {editingDomain && (
            <div className="space-y-4">
              <div>
                <Label>域名</Label>
                <Input
                  value={editingDomain.name}
                  onChange={(e) => setEditingDomain({...editingDomain, name: e.target.value})}
                />
              </div>
              <div>
                <Label>价格 (¥)</Label>
                <Input
                  type="number"
                  value={editingDomain.price}
                  onChange={(e) => setEditingDomain({...editingDomain, price: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>描述</Label>
                <Textarea
                  value={editingDomain.description || ''}
                  onChange={(e) => setEditingDomain({...editingDomain, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>分类</Label>
                  <Select
                    value={editingDomain.category || 'standard'}
                    onValueChange={(v) => setEditingDomain({...editingDomain, category: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="premium">高端</SelectItem>
                      <SelectItem value="standard">标准</SelectItem>
                      <SelectItem value="short">短域名</SelectItem>
                      <SelectItem value="numeric">数字</SelectItem>
                      <SelectItem value="brandable">品牌</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>状态</Label>
                  <Select
                    value={editingDomain.status || 'available'}
                    onValueChange={(v) => setEditingDomain({...editingDomain, status: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">可售</SelectItem>
                      <SelectItem value="sold">已售</SelectItem>
                      <SelectItem value="reserved">保留</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>取消</Button>
            <Button onClick={handleEditDomain}>保存更改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
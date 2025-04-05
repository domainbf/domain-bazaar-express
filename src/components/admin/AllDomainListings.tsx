
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DomainListing } from '@/types/domain';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Star, Check, Filter, Download, RefreshCw } from 'lucide-react';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const AllDomainListings = () => {
  const [domains, setDomains] = useState<DomainListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [selectedDomain, setSelectedDomain] = useState<DomainListing | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    available: 0,
    premium: 0,
  });

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('domain_listings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setDomains(data || []);

      // Calculate statistics
      if (data) {
        setStats({
          total: data.length,
          verified: data.filter(d => d.is_verified).length,
          pending: data.filter(d => d.verification_status === 'pending').length,
          available: data.filter(d => d.status === 'available').length,
          premium: data.filter(d => d.category === 'premium').length,
        });
      }
    } catch (error: any) {
      console.error('加载域名列表错误:', error);
      toast.error(error.message || '无法加载域名列表');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleHighlight = async (domain: DomainListing) => {
    try {
      const { error } = await supabase
        .from('domain_listings')
        .update({ highlight: !domain.highlight })
        .eq('id', domain.id);
      
      if (error) throw error;
      
      // Update local state
      setDomains(domains.map(d => 
        d.id === domain.id ? { ...d, highlight: !d.highlight } : d
      ));
      
      toast.success(`域名${domain.highlight ? '取消' : '设置为'}精选成功`);
    } catch (error: any) {
      console.error('更新域名精选状态错误:', error);
      toast.error(error.message || '更新域名精选状态失败');
    }
  };

  const updateDomainStatus = async (domain: DomainListing, status: string) => {
    try {
      const { error } = await supabase
        .from('domain_listings')
        .update({ status })
        .eq('id', domain.id);
      
      if (error) throw error;
      
      // Update local state
      setDomains(domains.map(d => 
        d.id === domain.id ? { ...d, status } : d
      ));
      
      toast.success(`域名状态已更新为${status === 'available' ? '在售' : status === 'sold' ? '已售' : '已保留'}`);
    } catch (error: any) {
      console.error('更新域名状态错误:', error);
      toast.error(error.message || '更新域名状态失败');
    }
  };

  const handleDeleteDomain = async (domain: DomainListing) => {
    if (!confirm(`确定要删除域名 ${domain.name} 吗?`)) return;
    
    try {
      const { error } = await supabase
        .from('domain_listings')
        .delete()
        .eq('id', domain.id);
      
      if (error) throw error;
      
      // Remove from local state
      setDomains(domains.filter(d => d.id !== domain.id));
      toast.success('域名已成功删除');
    } catch (error: any) {
      console.error('删除域名错误:', error);
      toast.error(error.message || '删除域名失败');
    }
  };

  const exportToCSV = () => {
    try {
      const headers = ["域名", "价格", "分类", "状态", "验证状态", "创建日期"];
      const csvContent = [
        headers.join(','),
        ...filteredDomains.map(domain => [
          domain.name,
          domain.price,
          domain.category,
          domain.status,
          domain.verification_status,
          domain.created_at
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', '域名列表.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('导出CSV错误:', error);
      toast.error('导出数据失败');
    }
  };

  const handleViewDetails = (domain: DomainListing) => {
    setSelectedDomain(domain);
    setIsDetailModalOpen(true);
  };

  const filteredDomains = domains.filter(domain => {
    // Filter by search query
    if (searchQuery && !domain.name?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filter by category
    if (categoryFilter !== 'all' && domain.category !== categoryFilter) {
      return false;
    }
    
    // Filter by status
    if (statusFilter !== 'all' && domain.status !== statusFilter) {
      return false;
    }
    
    // Filter by verification status
    if (verificationFilter !== 'all') {
      if (verificationFilter === 'verified' && !domain.is_verified) {
        return false;
      }
      if (verificationFilter === 'pending' && domain.verification_status !== 'pending') {
        return false;
      }
      if (verificationFilter === 'not_verified' && (domain.is_verified || domain.verification_status === 'pending')) {
        return false;
      }
    }
    
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">域名管理系统</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={loadDomains} className="flex items-center gap-1">
            <RefreshCw className="h-4 w-4" />
            刷新
          </Button>
          <Button size="sm" variant="outline" onClick={exportToCSV} className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            导出CSV
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium text-gray-500">总域名</CardTitle>
          </CardHeader>
          <CardContent className="py-0">
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium text-gray-500">已验证</CardTitle>
          </CardHeader>
          <CardContent className="py-0">
            <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium text-gray-500">待验证</CardTitle>
          </CardHeader>
          <CardContent className="py-0">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium text-gray-500">在售中</CardTitle>
          </CardHeader>
          <CardContent className="py-0">
            <div className="text-2xl font-bold text-blue-600">{stats.available}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium text-gray-500">高级域名</CardTitle>
          </CardHeader>
          <CardContent className="py-0">
            <div className="text-2xl font-bold text-purple-600">{stats.premium}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <Input 
          placeholder="搜索域名..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="选择分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有分类</SelectItem>
            <SelectItem value="standard">标准</SelectItem>
            <SelectItem value="premium">高级</SelectItem>
            <SelectItem value="short">短域名</SelectItem>
            <SelectItem value="dev">开发</SelectItem>
            <SelectItem value="brandable">品牌</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="选择状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有状态</SelectItem>
            <SelectItem value="available">在售中</SelectItem>
            <SelectItem value="sold">已售出</SelectItem>
            <SelectItem value="reserved">已保留</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={verificationFilter} onValueChange={setVerificationFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="验证状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有状态</SelectItem>
            <SelectItem value="verified">已验证</SelectItem>
            <SelectItem value="pending">待验证</SelectItem>
            <SelectItem value="not_verified">未验证</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left p-4 font-medium text-gray-500">域名</th>
              <th className="text-left p-4 font-medium text-gray-500">价格</th>
              <th className="text-left p-4 font-medium text-gray-500">分类</th>
              <th className="text-left p-4 font-medium text-gray-500">状态</th>
              <th className="text-left p-4 font-medium text-gray-500">验证</th>
              <th className="text-left p-4 font-medium text-gray-500">创建日期</th>
              <th className="text-left p-4 font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredDomains.map((domain) => (
              <tr key={domain.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <a 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        handleViewDetails(domain);
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      {domain.name}
                    </a>
                    {domain.highlight && (
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    )}
                  </div>
                </td>
                <td className="p-4">¥{domain.price}</td>
                <td className="p-4 capitalize">
                  {domain.category === 'standard' && '标准'}
                  {domain.category === 'premium' && '高级'}
                  {domain.category === 'short' && '短域名'} 
                  {domain.category === 'dev' && '开发'}
                  {domain.category === 'brandable' && '品牌'}
                </td>
                <td className="p-4 capitalize">
                  <span className={`px-2 py-1 rounded text-xs ${
                    domain.status === 'available' 
                      ? 'bg-blue-100 text-blue-800' 
                      : domain.status === 'sold'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {domain.status === 'available' ? '在售中' : 
                     domain.status === 'sold' ? '已售' : '已保留'}
                  </span>
                </td>
                <td className="p-4">
                  {domain.is_verified ? (
                    <span className="inline-flex items-center text-green-600">
                      <Check className="h-4 w-4 mr-1" />
                      已验证
                    </span>
                  ) : domain.verification_status === 'pending' ? (
                    <span className="text-yellow-600">待验证</span>
                  ) : (
                    <span className="text-gray-500">未验证</span>
                  )}
                </td>
                <td className="p-4">
                  {new Date(domain.created_at || '').toLocaleDateString()}
                </td>
                <td className="p-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(domain)}>
                        查看详情
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleHighlight(domain)}>
                        {domain.highlight ? '取消精选' : '设为精选'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => updateDomainStatus(domain, 'available')}>
                        设为在售
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateDomainStatus(domain, 'sold')}>
                        设为已售
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateDomainStatus(domain, 'reserved')}>
                        设为已保留
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteDomain(domain)}
                        className="text-red-600 focus:text-red-600"
                      >
                        删除域名
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
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">没有找到符合条件的域名</p>
        </div>
      )}
      
      {/* Domain details modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>域名详情</DialogTitle>
          </DialogHeader>
          
          {selectedDomain && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">域名:</span>
                  <p className="font-medium">{selectedDomain.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">价格:</span>
                  <p className="font-medium">¥{selectedDomain.price}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">分类:</span>
                  <p className="font-medium capitalize">
                    {selectedDomain.category === 'standard' && '标准'}
                    {selectedDomain.category === 'premium' && '高级'}
                    {selectedDomain.category === 'short' && '短域名'} 
                    {selectedDomain.category === 'dev' && '开发'}
                    {selectedDomain.category === 'brandable' && '品牌'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">状态:</span>
                  <p className="font-medium capitalize">
                    {selectedDomain.status === 'available' ? '在售中' : 
                     selectedDomain.status === 'sold' ? '已售' : '已保留'}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">验证状态:</span>
                  <p className="font-medium">
                    {selectedDomain.is_verified ? '已验证' : 
                     selectedDomain.verification_status === 'pending' ? '待验证' : '未验证'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">精选状态:</span>
                  <p className="font-medium">{selectedDomain.highlight ? '是' : '否'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">创建日期:</span>
                  <p className="font-medium">
                    {new Date(selectedDomain.created_at || '').toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">描述:</span>
                  <p className="font-medium">{selectedDomain.description || '暂无描述'}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>关闭</Button>
            {selectedDomain && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    toggleHighlight(selectedDomain);
                    setIsDetailModalOpen(false);
                  }}
                >
                  {selectedDomain.highlight ? '取消精选' : '设为精选'}
                </Button>
                <Button 
                  onClick={() => {
                    updateDomainStatus(selectedDomain, selectedDomain.status === 'available' ? 'reserved' : 'available');
                    setIsDetailModalOpen(false);
                  }}
                >
                  {selectedDomain.status === 'available' ? '下架域名' : '上架域名'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};


import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, RefreshCw, Filter, Download, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DomainForm } from '@/components/dashboard/DomainForm';
import { DomainListing } from '@/types/domain';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { DomainListManager } from './DomainListManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export const DomainManagement = () => {
  const [domains, setDomains] = useState<DomainListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDomainOpen, setIsAddDomainOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<DomainListing | null>(null);
  const [domainStats, setDomainStats] = useState({ total: 0, verified: 0, pending: 0, listed: 0 });
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('用户未登录');

      const { data, error } = await supabase
        .from('domain_listings')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setDomains(data || []);
      
      // Calculate domain statistics
      if (data) {
        const stats = {
          total: data.length,
          verified: data.filter(d => d.verification_status === 'verified').length,
          pending: data.filter(d => d.verification_status === 'pending').length,
          listed: data.filter(d => d.status === 'available').length
        };
        setDomainStats(stats);
      }
    } catch (error: any) {
      console.error('加载域名时出错:', error);
      toast.error(error.message || '加载域名失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDomain = (domain: DomainListing) => {
    setEditingDomain(domain);
    setIsAddDomainOpen(true);
  };

  const handleDeleteDomain = async (domainId: string) => {
    const confirmed = window.confirm('您确定要删除这个域名吗？此操作不可撤销。');
    
    if (!confirmed) return;
    
    try {
      // Check if there are any verifications for this domain
      const { data: verifications, error: verificationError } = await supabase
        .from('domain_verifications')
        .select('id')
        .eq('domain_id', domainId);
      
      if (verificationError) throw verificationError;
      
      // Delete any verifications
      if (verifications && verifications.length > 0) {
        const { error: deleteVerificationError } = await supabase
          .from('domain_verifications')
          .delete()
          .eq('domain_id', domainId);
        
        if (deleteVerificationError) throw deleteVerificationError;
      }
      
      // Delete the domain
      const { error: deleteDomainError } = await supabase
        .from('domain_listings')
        .delete()
        .eq('id', domainId);
      
      if (deleteDomainError) throw deleteDomainError;
      
      toast.success('域名已成功删除');
      loadDomains();
    } catch (error: any) {
      console.error('删除域名时出错:', error);
      toast.error(error.message || '删除域名失败');
    }
  };

  const handleBatchAction = (action: string) => {
    toast.info(`批量${action}功能即将上线，敬请期待`);
  };

  const exportDomainsToCSV = () => {
    try {
      // Convert domains to CSV format
      const headers = ['域名', '价格', '分类', '状态', '验证状态', '创建日期'];
      const csvContent = [
        headers.join(','),
        ...domains.map(domain => [
          domain.name || '',
          domain.price || '0',
          domain.category || '标准',
          domain.status === 'available' ? '在售中' : domain.status === 'sold' ? '已售出' : '未上架',
          domain.verification_status === 'verified' ? '已验证' : '待验证',
          new Date(domain.created_at || '').toLocaleDateString()
        ].join(','))
      ].join('\n');
      
      // Create a download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = '我的域名列表.csv';
      link.click();
    } catch (error) {
      console.error('导出域名数据失败:', error);
      toast.error('导出域名数据失败');
    }
  };

  const filteredDomains = domains.filter(domain => {
    // Filter by tab
    if (activeTab !== "all") {
      if (activeTab === "verified" && domain.verification_status !== 'verified') return false;
      if (activeTab === "pending" && domain.verification_status !== 'pending') return false;
      if (activeTab === "listed" && domain.status !== 'available') return false;
    }
    
    // Filter by search query
    if (searchQuery && !domain.name?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold mb-3">您的域名资产</h2>
          <div className="flex flex-wrap gap-2">
            <Card className="bg-white border-blue-100 shadow-sm">
              <CardContent className="p-3 flex items-center gap-2">
                <div className="text-2xl font-bold text-blue-600">{domainStats.total}</div>
                <div className="text-sm text-gray-600">总计</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-green-100 shadow-sm">
              <CardContent className="p-3 flex items-center gap-2">
                <div className="text-2xl font-bold text-green-600">{domainStats.verified}</div>
                <div className="text-sm text-gray-600">已验证</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-yellow-100 shadow-sm">
              <CardContent className="p-3 flex items-center gap-2">
                <div className="text-2xl font-bold text-yellow-600">{domainStats.pending}</div>
                <div className="text-sm text-gray-600">待验证</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-indigo-100 shadow-sm">
              <CardContent className="p-3 flex items-center gap-2">
                <div className="text-2xl font-bold text-indigo-600">{domainStats.listed}</div>
                <div className="text-sm text-gray-600">在售中</div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <div className="relative">
            <Input
              placeholder="搜索域名..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-[200px]"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>批量操作</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => exportDomainsToCSV()}>
                <Download className="w-4 h-4 mr-2" />导出CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBatchAction("上架")}>
                <Upload className="w-4 h-4 mr-2" />批量上架
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBatchAction("下架")}>
                <Download className="w-4 h-4 mr-2" />批量下架
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadDomains}
            className="flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            刷新
          </Button>
          
          <Button 
            onClick={() => {
              setEditingDomain(null);
              setIsAddDomainOpen(true);
            }}
            className="bg-black text-white hover:bg-gray-800"
            id="add-domain-button"
          >
            <Plus className="w-4 h-4 mr-2" />
            添加域名
          </Button>
        </div>
      </div>

      {domains.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">全部 ({domainStats.total})</TabsTrigger>
            <TabsTrigger value="verified">已验证 ({domainStats.verified})</TabsTrigger>
            <TabsTrigger value="pending">待验证 ({domainStats.pending})</TabsTrigger>
            <TabsTrigger value="listed">在售中 ({domainStats.listed})</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <DomainListManager
        domains={filteredDomains}
        onEdit={handleEditDomain}
        onDelete={handleDeleteDomain}
        onRefresh={loadDomains}
      />

      {/* Add/Edit Domain Dialog */}
      <Dialog open={isAddDomainOpen} onOpenChange={setIsAddDomainOpen}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-black">
              {editingDomain ? '编辑域名' : '添加新域名'}
            </DialogTitle>
          </DialogHeader>
          <DomainForm 
            isOpen={isAddDomainOpen} 
            onClose={() => setIsAddDomainOpen(false)} 
            onSuccess={loadDomains} 
            editingDomain={editingDomain} 
          />
        </DialogContent>
      </Dialog>

      {/* Domain Management Guide Card */}
      <Card className="mt-6 bg-gray-50">
        <CardHeader>
          <CardTitle>域名管理指南</CardTitle>
          <CardDescription>如何管理您的域名资产</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">添加域名</h3>
              <p className="text-sm text-gray-600 mb-3">添加您拥有的域名到平台，设置价格和详细信息。</p>
              <div className="text-xs text-gray-500">注意：添加的域名需要进行所有权验证</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">验证所有权</h3>
              <p className="text-sm text-gray-600 mb-3">验证您对域名的所有权，以便将其上架到市场。</p>
              <div className="text-xs text-gray-500">支持DNS和文件验证方式</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">上架/下架</h3>
              <p className="text-sm text-gray-600 mb-3">随时决定是否将您的域名展示在市场上供他人购买。</p>
              <div className="text-xs text-gray-500">已验证的域名可以随时上架或下架</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

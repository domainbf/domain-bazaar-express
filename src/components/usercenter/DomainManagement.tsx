
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, RefreshCw, ExternalLink, Edit, Trash, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DomainForm } from '@/components/dashboard/DomainForm';
import { DomainListingsTable } from '@/components/dashboard/DomainListingsTable';
import { DomainListing } from '@/types/domain';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const DomainManagement = () => {
  const [domains, setDomains] = useState<DomainListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDomainOpen, setIsAddDomainOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<DomainListing | null>(null);
  const [domainStats, setDomainStats] = useState({ total: 0, verified: 0, pending: 0, listed: 0 });
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

  const handleVerifyDomain = (domainId: string) => {
    navigate(`/domain-verification/${domainId}`);
  };

  const handleViewInMarketplace = (domain: DomainListing) => {
    navigate(`/marketplace?search=${domain.name}`);
  };

  const handleToggleStatus = async (domain: DomainListing) => {
    try {
      const newStatus = domain.status === 'available' ? 'reserved' : 'available';
      const { error } = await supabase
        .from('domain_listings')
        .update({ status: newStatus })
        .eq('id', domain.id);
      
      if (error) throw error;
      
      toast.success(newStatus === 'available' ? '域名已成功上架' : '域名已成功下架');
      loadDomains();
    } catch (error: any) {
      console.error('更新域名状态时出错:', error);
      toast.error(error.message || '更新域名状态失败');
    }
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

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">您的域名</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="px-2 py-1 bg-gray-100 rounded-full">总计: {domainStats.total}</span>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">已验证: {domainStats.verified}</span>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">待验证: {domainStats.pending}</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">在售中: {domainStats.listed}</span>
          </div>
        </div>
        <div className="flex space-x-2">
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

      {domains.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>未找到域名</CardTitle>
            <CardDescription>
              您还没有添加任何域名。点击"添加域名"按钮开始使用。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Button 
                onClick={() => {
                  setEditingDomain(null);
                  setIsAddDomainOpen(true);
                }}
                className="bg-black text-white hover:bg-gray-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                添加您的第一个域名
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-4 border-b">域名</th>
                <th className="text-left p-4 border-b">价格</th>
                <th className="text-left p-4 border-b">分类</th>
                <th className="text-left p-4 border-b">状态</th>
                <th className="text-left p-4 border-b">上架/下架</th>
                <th className="text-left p-4 border-b">操作</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((domain) => (
                <tr key={domain.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-medium">{domain.name}</div>
                    {domain.highlight && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">精选</span>}
                  </td>
                  <td className="p-4">¥{domain.price}</td>
                  <td className="p-4 capitalize">
                    {domain.category === 'standard' && '标准'}
                    {domain.category === 'premium' && '高级'}
                    {domain.category === 'short' && '短域名'} 
                    {domain.category === 'dev' && '开发'}
                    {domain.category === 'brandable' && '品牌'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      domain.verification_status === 'verified' 
                        ? 'bg-green-100 text-green-800' 
                        : domain.verification_status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : ''
                    }`}>
                      {domain.verification_status === 'verified' && '已验证'}
                      {domain.verification_status === 'pending' && '待验证'}
                    </span>
                    <span className={`ml-1 px-2 py-1 rounded text-xs ${
                      domain.status === 'available' 
                        ? 'bg-blue-100 text-blue-800' 
                        : domain.status === 'sold'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {domain.status === 'available' && '在售中'}
                      {domain.status === 'sold' && '已售出'}
                      {domain.status === 'reserved' && '未上架'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center">
                      <Switch
                        id={`status-switch-${domain.id}`}
                        checked={domain.status === 'available'}
                        onCheckedChange={() => handleToggleStatus(domain)}
                        disabled={domain.verification_status !== 'verified'}
                      />
                      <Label htmlFor={`status-switch-${domain.id}`} className="ml-2">
                        {domain.status === 'available' ? '已上架' : '未上架'}
                      </Label>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEditDomain(domain)}
                        className="border-gray-300 text-black hover:bg-gray-100"
                        title="编辑域名"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      {domain.verification_status !== 'verified' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleVerifyDomain(domain.id as string)}
                          className="border-gray-300 text-green-600 hover:bg-green-50 hover:border-green-300"
                          title="验证域名"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {domain.status === 'available' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleViewInMarketplace(domain)}
                          className="border-gray-300 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                          title="在市场中查看"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeleteDomain(domain.id as string)}
                        className="border-gray-300 text-red-600 hover:bg-red-50 hover:border-red-300"
                        title="删除域名"
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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

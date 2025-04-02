
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Edit, Trash, CheckCircle, ExternalLink, Eye } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { DomainListing } from "@/types/domain";
import { useNavigate } from 'react-router-dom';

interface DomainListingsTableProps {
  domains: DomainListing[];
  onEdit: (domain: DomainListing) => void;
  onRefresh: () => Promise<void>;
  onVerify?: (domainId: string) => void;
  onDelete?: (domainId: string) => Promise<void>;
  showActions?: boolean;
}

export const DomainListingsTable = ({ 
  domains, 
  onEdit, 
  onRefresh, 
  onVerify, 
  onDelete, 
  showActions = true 
}: DomainListingsTableProps) => {
  const navigate = useNavigate();
  
  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm('您确定要删除这个域名吗？')) return;

    try {
      if (onDelete) {
        await onDelete(domainId);
      } else {
        const { error } = await supabase
          .from('domain_listings')
          .delete()
          .eq('id', domainId);
        
        if (error) throw error;
        toast.success('域名已成功删除');
        onRefresh();
      }
    } catch (error: any) {
      console.error('删除域名时出错:', error);
      toast.error(error.message || '删除域名失败');
    }
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
      onRefresh();
    } catch (error: any) {
      console.error('更新域名状态时出错:', error);
      toast.error(error.message || '更新域名状态失败');
    }
  };

  if (domains.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-600 mb-4">您还没有列出任何域名</p>
        <Button 
          onClick={() => document.getElementById('add-domain-button')?.click()}
          className="bg-black text-white hover:bg-gray-800"
        >
          添加您的第一个域名
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left p-4 border-b">域名</th>
            <th className="text-left p-4 border-b">价格</th>
            <th className="text-left p-4 border-b">分类</th>
            <th className="text-left p-4 border-b">状态</th>
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
                <div className="flex flex-col space-y-1">
                  <span className={`px-2 py-1 rounded text-xs ${
                    domain.verification_status === 'verified' 
                      ? 'bg-green-100 text-green-800' 
                      : domain.verification_status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {domain.verification_status === 'verified' && '已验证'}
                    {domain.verification_status === 'pending' && '待验证'} 
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
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
                </div>
              </td>
              {showActions && (
                <td className="p-4">
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onEdit(domain)}
                      className="border-gray-300 text-black hover:bg-gray-100"
                      title="编辑域名"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    {onVerify && domain.verification_status !== 'verified' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => onVerify(domain.id as string)}
                        className="border-gray-300 text-green-600 hover:bg-green-50 hover:border-green-300"
                        title="验证域名"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {domain.verification_status === 'verified' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleToggleStatus(domain)}
                        className={`border-gray-300 ${
                          domain.status === 'available' 
                            ? 'text-orange-600 hover:bg-orange-50 hover:border-orange-300' 
                            : 'text-blue-600 hover:bg-blue-50 hover:border-blue-300'
                        }`}
                        title={domain.status === 'available' ? '下架域名' : '上架域名'}
                      >
                        {domain.status === 'available' ? '下架' : '上架'}
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
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

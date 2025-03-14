
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Edit, Trash, CheckCircle } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { DomainListing } from "@/types/domain";

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
              <td className="p-4 capitalize">
                {domain.verification_status === 'verified' && '已验证'}
                {domain.verification_status === 'pending' && '待验证'} 
                {domain.status === 'available' && '可用'}
                {domain.status === 'sold' && '已售'}
                {domain.status === 'reserved' && '已预留'}
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
                        <CheckCircle className="w-4 h-4" />
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

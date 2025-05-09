
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";

interface DeleteDomainConfirmProps {
  domain: {
    id: string;
    name: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const DeleteDomainConfirm = ({ 
  domain, 
  onSuccess, 
  onCancel,
  isLoading,
  setIsLoading
}: DeleteDomainConfirmProps) => {
  const { t } = useTranslation();
  const [confirmText, setConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  const handleDelete = async () => {
    if (!domain.id) return;
    
    setIsLoading(true);
    setDeleteError(null);
    
    try {
      // 删除与域名关联的所有数据：采用并行处理删除操作，提高性能
      await Promise.all([
        // 1. 删除域名分析记录
        supabase
          .from('domain_analytics')
          .delete()
          .eq('domain_id', domain.id),
        
        // 2. 删除域名验证记录
        supabase
          .from('domain_verifications')
          .delete()
          .eq('domain_id', domain.id),
        
        // 3. 删除域名历史记录
        supabase
          .from('domain_history')
          .delete()
          .eq('domain_id', domain.id),
          
        // 4. 删除域名收藏记录
        supabase
          .from('user_favorites')
          .delete()
          .eq('domain_id', domain.id),
          
        // 5. 删除域名报价记录
        supabase
          .from('domain_offers')
          .delete()
          .eq('domain_id', domain.id),
      ]);
      
      // 最后删除域名列表本身
      const { error } = await supabase
        .from('domain_listings')
        .delete()
        .eq('id', domain.id);
      
      if (error) throw error;
      
      toast.success(t('domainActions.deleteDomainSuccess', '域名已成功删除'));
      onSuccess();
    } catch (error: any) {
      console.error('Error deleting domain:', error);
      setDeleteError(error.message || t('common.error', '删除域名失败'));
      toast.error(error.message || t('common.error', '删除域名失败'));
    } finally {
      setIsLoading(false);
    }
  };

  const isDeleteDisabled = domain.name !== confirmText && confirmText !== "DELETE";

  return (
    <div className="space-y-4">
      <div className="flex items-start space-x-2 text-amber-600 bg-amber-50 p-3 rounded-md">
        <AlertTriangle className="h-5 w-5 mt-0.5" />
        <div>
          <h4 className="font-medium text-amber-800">{t('common.warning', '警告')}</h4>
          <p className="text-sm text-amber-700">
            {t('domainActions.deleteWarning', '此操作不可逆。删除域名将移除所有相关数据，包括分析、验证和报价记录。')}
          </p>
        </div>
      </div>
      
      <p className="text-gray-700">
        {t('domainActions.deleteDomainConfirm', '您确定要删除域名')} <span className="font-bold">{domain.name}</span> {t('common.question', '吗？')}
      </p>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {t('domainActions.typeToConfirm', '请输入域名或"DELETE"以确认删除')}
        </label>
        <input
          type="text"
          className="w-full border border-gray-300 rounded-md p-2 text-sm"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={domain.name}
        />
      </div>
      
      {deleteError && (
        <p className="text-sm text-red-600">{deleteError}</p>
      )}
      
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          {t('common.cancel', '取消')}
        </Button>
        <Button 
          variant="destructive" 
          onClick={handleDelete}
          disabled={isDeleteDisabled || isLoading}
        >
          {isLoading ? t('common.deleting', '删除中...') : t('common.confirm', '确认删除')}
        </Button>
      </div>
    </div>
  );
};


import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

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
  
  const handleDelete = async () => {
    if (!domain.id) return;
    
    setIsLoading(true);
    try {
      // 先删除关联的分析记录
      await supabase
        .from('domain_analytics')
        .delete()
        .eq('domain_id', domain.id);
      
      // 删除验证记录（如果有）
      await supabase
        .from('domain_verifications')
        .delete()
        .eq('domain_id', domain.id);
      
      // 然后删除域名列表
      const { error } = await supabase
        .from('domain_listings')
        .delete()
        .eq('id', domain.id);
      
      if (error) throw error;
      
      toast.success(t('domainActions.deleteDomainSuccess', '域名已成功删除'));
      onSuccess();
    } catch (error: any) {
      console.error('Error deleting domain:', error);
      toast.error(error.message || t('common.error', '删除域名失败'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-700">
        {t('domainActions.deleteDomainConfirm', '您确定要删除域名')} <span className="font-bold">{domain.name}</span> {t('common.question', '吗？此操作不可逆。')}
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          {t('common.cancel', '取消')}
        </Button>
        <Button 
          variant="destructive" 
          onClick={handleDelete}
          disabled={isLoading}
        >
          {isLoading ? t('common.deleting', '删除中...') : t('common.confirm', '确认删除')}
        </Button>
      </div>
    </div>
  );
};

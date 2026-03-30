
import { Button } from "@/components/ui/button";
import { apiDelete } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

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
  const { user } = useAuth();
  const [confirmText, setConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  const handleDelete = async () => {
    if (!domain.id || !user) return;
    
    setIsLoading(true);
    setDeleteError(null);
    
    try {
      await apiDelete(`/data/domain-listings/${domain.id}`);
      
      toast.success('域名已成功删除', {
        description: `${domain.name} 及其所有关联数据已被移除`
      });
      onSuccess();
    } catch (error: any) {
      console.error('Error deleting domain:', error);
      const msg = error.message || '删除域名失败';
      setDeleteError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const isDeleteConfirmed = confirmText === domain.name || confirmText === "DELETE";

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 text-destructive bg-destructive/10 p-4 rounded-lg">
        <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
        <div>
          <h4 className="font-semibold text-destructive">此操作不可逆</h4>
          <p className="text-sm text-destructive/80 mt-1">
            删除域名将永久移除所有相关数据，包括浏览统计、验证记录、价格历史和报价记录。
          </p>
        </div>
      </div>
      
      <p className="text-foreground">
        确定要删除域名 <span className="font-bold text-foreground">{domain.name}</span> 吗？
      </p>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          请输入域名 <code className="bg-muted px-1.5 py-0.5 rounded text-sm">{domain.name}</code> 或 <code className="bg-muted px-1.5 py-0.5 rounded text-sm">DELETE</code> 以确认
        </label>
        <input
          type="text"
          className="w-full border border-border rounded-md p-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={domain.name}
          autoFocus
        />
      </div>
      
      {deleteError && (
        <p className="text-sm text-destructive bg-destructive/5 p-2 rounded">{deleteError}</p>
      )}
      
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          取消
        </Button>
        <Button 
          variant="destructive" 
          onClick={handleDelete}
          disabled={!isDeleteConfirmed || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              删除中...
            </>
          ) : '确认删除'}
        </Button>
      </div>
    </div>
  );
};

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { apiPatch } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import { PackageCheck, PackageX, Package, Loader2 } from 'lucide-react';

interface Domain {
  id: string;
  name: string;
  status?: string;
}

interface DomainStatusManagerProps {
  domain: Domain;
  onStatusChange: () => void;
}

export const DomainStatusManager = ({ domain, onStatusChange }: DomainStatusManagerProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [newStatus, setNewStatus] = useState(domain.status || 'available');
  const [isLoading, setIsLoading] = useState(false);

  const statusOptions = [
    { value: 'available', label: '可售', icon: PackageCheck, color: 'text-green-600 dark:text-green-400' },
    { value: 'pending', label: '暂不出售', icon: Package, color: 'text-yellow-600 dark:text-yellow-400' },
    { value: 'reserved', label: '保留', icon: Package, color: 'text-purple-600 dark:text-purple-400' },
    { value: 'sold', label: '已售', icon: PackageX, color: 'text-muted-foreground' },
  ];

  const handleStatusChange = async () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    if (newStatus === domain.status) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      await apiPatch(`/data/domain-listings/${domain.id}`, { status: newStatus });
      toast.success(`域名状态已更新为「${statusOptions.find(o => o.value === newStatus)?.label}」`);
      setIsOpen(false);
      onStatusChange();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.message || '更新状态失败');
    } finally {
      setIsLoading(false);
    }
  };

  const currentStatusConfig = statusOptions.find(opt => opt.value === domain.status) || statusOptions[0];

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setNewStatus(domain.status || 'available');
          setIsOpen(true);
        }}
        className="flex items-center gap-1.5"
      >
        <currentStatusConfig.icon className={`w-4 h-4 ${currentStatusConfig.color}`} />
        <span className="hidden sm:inline text-xs">{currentStatusConfig.label}</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>更改域名状态</DialogTitle>
            <DialogDescription>
              为 <span className="font-semibold text-foreground">{domain.name}</span> 选择新的状态
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            {statusOptions.map(option => {
              const Icon = option.icon;
              const isSelected = newStatus === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setNewStatus(option.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${option.color}`} />
                  <span className={`font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {option.label}
                  </span>
                  {option.value === domain.status && (
                    <span className="ml-auto text-xs text-muted-foreground">当前</span>
                  )}
                </button>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
              取消
            </Button>
            <Button onClick={handleStatusChange} disabled={isLoading || newStatus === domain.status}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  更新中...
                </>
              ) : '确认更改'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

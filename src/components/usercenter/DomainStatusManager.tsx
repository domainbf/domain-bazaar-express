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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PackageCheck, PackageX, Package } from 'lucide-react';

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
  const [isOpen, setIsOpen] = useState(false);
  const [newStatus, setNewStatus] = useState(domain.status || 'available');
  const [isLoading, setIsLoading] = useState(false);

  const statusOptions = [
    { value: 'available', label: '可售', icon: PackageCheck, color: 'text-green-600' },
    { value: 'pending', label: '审核中', icon: Package, color: 'text-yellow-600' },
    { value: 'sold', label: '已售', icon: PackageX, color: 'text-gray-600' },
  ];

  const handleStatusChange = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('domain_listings')
        .update({ status: newStatus })
        .eq('id', domain.id);

      if (error) throw error;

      toast.success('域名状态已更新');
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
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
      >
        <currentStatusConfig.icon className={`w-4 h-4 ${currentStatusConfig.color}`} />
        <span className="hidden sm:inline">{currentStatusConfig.label}</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>更改域名状态</DialogTitle>
            <DialogDescription>
              为 <span className="font-semibold">{domain.name}</span> 选择新的状态
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className={`w-4 h-4 ${option.color}`} />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
              取消
            </Button>
            <Button onClick={handleStatusChange} disabled={isLoading}>
              {isLoading ? '更新中...' : '确认更改'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

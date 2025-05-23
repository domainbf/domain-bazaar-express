
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2 } from 'lucide-react';
import { DomainForm } from './domain/DomainForm';
import { DeleteDomainConfirm } from './domain/DeleteDomainConfirm';

interface Domain {
  id: string;
  name: string;
  price: number;
  category?: string;
  description?: string;
  status?: string;
}

interface DomainActionsProps {
  domain?: Domain;
  onSuccess: () => void;
  mode: 'add' | 'edit' | 'delete';
}

export const DomainActions = ({ domain, onSuccess, mode }: DomainActionsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDialogClose = () => {
    if (!isLoading) {
      setIsOpen(false);
    }
  };
  
  const handleSuccess = () => {
    setIsOpen(false);
    onSuccess();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {mode === 'add' ? (
          <Button className="flex items-center gap-2" onClick={() => setIsOpen(true)}>
            <Plus className="w-4 h-4" />
            添加域名
          </Button>
        ) : mode === 'edit' ? (
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 text-blue-600"
            onClick={() => setIsOpen(true)}
          >
            <Edit className="w-4 h-4" />
            编辑
          </Button>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 text-red-600"
            onClick={() => setIsOpen(true)}
          >
            <Trash2 className="w-4 h-4" />
            删除
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? '添加新域名' : mode === 'edit' ? '编辑域名' : '删除域名'}
          </DialogTitle>
        </DialogHeader>
        {mode === 'delete' && domain ? (
          <DeleteDomainConfirm 
            domain={domain} 
            onSuccess={handleSuccess}
            onCancel={handleDialogClose}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        ) : (
          <DomainForm 
            domain={domain} 
            mode={mode === 'add' ? 'add' : 'edit'}
            onSuccess={handleSuccess}
            onCancel={handleDialogClose}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: domain?.name || '',
    price: domain?.price || 0,
    category: domain?.category || 'standard',
    description: domain?.description || '',
    status: domain?.status || 'available'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDelete = async () => {
    if (!domain?.id) return;
    
    setIsLoading(true);
    try {
      // First delete any associated analytics records
      await supabase
        .from('domain_analytics')
        .delete()
        .eq('domain_id', domain.id);
      
      // Then delete the domain listing
      const { error } = await supabase
        .from('domain_listings')
        .delete()
        .eq('id', domain.id);
      
      if (error) throw error;
      
      toast.success('域名已成功删除');
      setIsOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error deleting domain:', error);
      toast.error(error.message || '删除域名失败');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('请先登录');
      return;
    }
    
    setIsLoading(true);
    try {
      const domainData = {
        ...formData,
        price: parseFloat(formData.price.toString()),
        owner_id: user.id
      };
      
      let result;
      let newDomainId;
      
      if (mode === 'add') {
        // 先添加域名记录
        result = await supabase
          .from('domain_listings')
          .insert([domainData])
          .select();

        if (result.error) throw result.error;
        newDomainId = result.data?.[0]?.id;
        
        // 创建analytics记录
        if (newDomainId) {
          const { error: analyticsError } = await supabase
            .from('domain_analytics')
            .insert({
              domain_id: newDomainId,
              views: 0,
              favorites: 0,
              offers: 0
            });
          
          if (analyticsError) {
            console.error('Error creating analytics record:', analyticsError);
            // 不向用户显示此错误，因为它不影响主要功能
          }
        }
      } else if (mode === 'edit' && domain?.id) {
        result = await supabase
          .from('domain_listings')
          .update(domainData)
          .eq('id', domain.id);
      }
      
      const { error } = result || {};
      if (error) throw error;
      
      toast.success(mode === 'add' ? '域名已成功添加' : '域名已成功更新');
      setIsOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error submitting domain:', error);
      toast.error(error.message || '提交域名失败');
    } finally {
      setIsLoading(false);
    }
  };

  const renderTriggerButton = () => {
    switch (mode) {
      case 'add':
        return (
          <Button className="flex items-center gap-2" onClick={() => setIsOpen(true)}>
            <Plus className="w-4 h-4" />
            添加域名
          </Button>
        );
      case 'edit':
        return (
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 text-blue-600"
            onClick={() => setIsOpen(true)}
          >
            <Edit className="w-4 h-4" />
            编辑
          </Button>
        );
      case 'delete':
        return (
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 text-red-600"
            onClick={() => setIsOpen(true)}
          >
            <Trash2 className="w-4 h-4" />
            删除
          </Button>
        );
    }
  };

  const renderDialogContent = () => {
    if (mode === 'delete') {
      return (
        <div className="space-y-4">
          <p className="text-gray-700">
            您确定要删除域名 <span className="font-bold">{domain?.name}</span> 吗？此操作不可逆。
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              取消
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? '删除中...' : '确认删除'}
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">域名名称</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="example.com"
            required
            disabled={mode === 'edit'}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="price">价格</Label>
          <Input
            id="price"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            placeholder="1000"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="category">分类</Label>
          <Select 
            value={formData.category} 
            onValueChange={(value) => handleSelectChange('category', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="premium">高级域名</SelectItem>
              <SelectItem value="standard">标准域名</SelectItem>
              <SelectItem value="short">短域名</SelectItem>
              <SelectItem value="brandable">品牌域名</SelectItem>
              <SelectItem value="dev">开发域名</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">描述</Label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="添加关于此域名的描述..."
            className="w-full border border-gray-300 rounded-md p-2 min-h-[100px]"
          />
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            取消
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '提交中...' : mode === 'add' ? '添加域名' : '更新域名'}
          </Button>
        </div>
      </form>
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {renderTriggerButton()}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? '添加新域名' : mode === 'edit' ? '编辑域名' : '删除域名'}
          </DialogTitle>
        </DialogHeader>
        {renderDialogContent()}
      </DialogContent>
    </Dialog>
  );
};

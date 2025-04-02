
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from 'lucide-react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DomainListing } from "@/types/domain";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DomainFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  editingDomain: DomainListing | null;
}

export const DomainForm = ({ isOpen, onClose, onSuccess, editingDomain }: DomainFormProps) => {
  const [domainName, setDomainName] = useState('');
  const [domainPrice, setDomainPrice] = useState('');
  const [domainDescription, setDomainDescription] = useState('');
  const [domainCategory, setDomainCategory] = useState('standard');
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (editingDomain) {
      setDomainName(editingDomain.name || '');
      setDomainPrice(editingDomain.price?.toString() || '');
      setDomainDescription(editingDomain.description || '');
      setDomainCategory(editingDomain.category || 'standard');
      setIsHighlighted(editingDomain.highlight || false);
    } else {
      resetForm();
    }
  }, [editingDomain, isOpen]);

  const resetForm = () => {
    setDomainName('');
    setDomainPrice('');
    setDomainDescription('');
    setDomainCategory('standard');
    setIsHighlighted(false);
    setNameError('');
  };

  const validateDomainName = (name: string) => {
    // Basic domain name validation
    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setNameError('');

    try {
      // Validate inputs
      if (!domainName) throw new Error('域名不能为空');
      if (!validateDomainName(domainName)) {
        setNameError('请输入有效的域名格式，例如：example.com');
        throw new Error('请输入有效的域名格式');
      }
      if (!domainPrice || isNaN(Number(domainPrice))) throw new Error('请输入有效的价格');
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('用户未登录');

      // If we're adding a new domain, check if it already exists
      if (!editingDomain) {
        const { data: existingDomains } = await supabase
          .from('domain_listings')
          .select('*')
          .eq('name', domainName);
          
        if (existingDomains && existingDomains.length > 0) {
          throw new Error('该域名已存在，请选择其他域名');
        }
      }

      const domainData = {
        name: domainName,
        price: parseFloat(domainPrice),
        description: domainDescription,
        category: domainCategory,
        highlight: isHighlighted,
        owner_id: user.id,
        // Start as reserved (not available) until verified
        status: editingDomain?.verification_status === 'verified' ? (editingDomain.status || 'reserved') : 'reserved'
      };

      if (editingDomain) {
        // Update existing domain
        const { error } = await supabase
          .from('domain_listings')
          .update(domainData)
          .eq('id', editingDomain.id);
        
        if (error) throw error;
        toast.success('域名已成功更新');
      } else {
        // Add new domain
        const { error } = await supabase
          .from('domain_listings')
          .insert([domainData]);
        
        if (error) throw error;
        toast.success('域名已成功添加');
      }

      // Reset form and close dialog
      resetForm();
      onClose();
      onSuccess();
    } catch (error: any) {
      console.error('保存域名时出错:', error);
      toast.error(error.message || '保存域名失败');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="domainName" className="text-sm font-medium text-gray-700">域名</Label>
        <Input
          id="domainName"
          value={domainName}
          onChange={(e) => {
            setDomainName(e.target.value);
            if (nameError) setNameError('');
          }}
          required
          className={`bg-white border-gray-300 ${nameError ? 'border-red-500' : ''}`}
          placeholder="example.com"
          disabled={editingDomain !== null} // Cannot change domain name when editing
        />
        {nameError && <p className="text-sm text-red-500 mt-1">{nameError}</p>}
        <p className="text-xs text-gray-500">
          {editingDomain 
            ? '域名不可更改，如需变更请删除后重新添加' 
            : '请输入您拥有的有效域名，添加后需要进行所有权验证'}
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="domainPrice" className="text-sm font-medium text-gray-700">价格 (¥)</Label>
        <Input
          id="domainPrice"
          type="number"
          value={domainPrice}
          onChange={(e) => setDomainPrice(e.target.value)}
          required
          className="bg-white border-gray-300"
          placeholder="1000"
          min="1"
          step="0.01"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="domainCategory" className="text-sm font-medium text-gray-700">分类</Label>
        <Select
          value={domainCategory}
          onValueChange={setDomainCategory}
        >
          <SelectTrigger className="w-full bg-white border-gray-300">
            <SelectValue placeholder="选择分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>域名分类</SelectLabel>
              <SelectItem value="standard">标准</SelectItem>
              <SelectItem value="premium">高级</SelectItem>
              <SelectItem value="short">短域名</SelectItem>
              <SelectItem value="dev">开发</SelectItem>
              <SelectItem value="brandable">品牌</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="domainDescription" className="text-sm font-medium text-gray-700">描述</Label>
        <textarea
          id="domainDescription"
          value={domainDescription}
          onChange={(e) => setDomainDescription(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded-md p-2 text-black"
          placeholder="描述您的域名（可选）"
          rows={3}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="highlight"
          checked={isHighlighted}
          onCheckedChange={(checked) => setIsHighlighted(checked as boolean)}
        />
        <Label htmlFor="highlight" className="text-sm font-medium text-gray-700">
          设为推荐域名（精选）
        </Label>
      </div>
      
      <Button 
        type="submit"
        disabled={formLoading}
        className="w-full bg-black text-white hover:bg-gray-800"
      >
        {formLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="animate-spin w-4 h-4" />
            保存中...
          </span>
        ) : (
          editingDomain ? '更新域名' : '添加域名'
        )}
      </Button>
      
      {!editingDomain && (
        <p className="text-xs text-gray-500 text-center">
          添加域名后，需要进行所有权验证才能将其上架销售
        </p>
      )}
    </form>
  );
};

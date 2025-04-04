
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DomainListing } from "@/types/domain";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DomainFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  editingDomain: DomainListing | null;
}

export const DomainForm = ({ isOpen, onClose, onSuccess, editingDomain }: DomainFormProps) => {
  const { user } = useAuth();
  const [domainName, setDomainName] = useState('');
  const [domainPrice, setDomainPrice] = useState('');
  const [domainDescription, setDomainDescription] = useState('');
  const [domainCategory, setDomainCategory] = useState('standard');
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [isDomainChecking, setIsDomainChecking] = useState(false);
  const [isDomainAvailable, setIsDomainAvailable] = useState<boolean | null>(null);

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
    setIsDomainAvailable(null);
  };

  const validateDomainName = (name: string) => {
    // Basic domain name validation
    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(name);
  };

  const checkDomainAvailability = async (name: string) => {
    if (!name || !validateDomainName(name) || !user) return;
    
    try {
      setIsDomainChecking(true);
      setIsDomainAvailable(null);
      
      // Check if domain exists in our database
      const { data: existingDomains, error } = await supabase
        .from('domain_listings')
        .select('id')
        .eq('name', name)
        .neq('owner_id', user.id) // Exclude domains owned by current user
        .limit(1);
      
      if (error) throw error;
      
      // If domain exists in our database and is not owned by current user, it's not available
      setIsDomainAvailable(existingDomains.length === 0);
      
    } catch (error) {
      console.error('检查域名可用性时出错:', error);
      setIsDomainAvailable(null);
    } finally {
      setIsDomainChecking(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (domainName && !editingDomain && validateDomainName(domainName)) {
        checkDomainAvailability(domainName);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [domainName]);

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
        toast.success('域名已成功添加', {
          description: "请完成域名所有权验证后再上架",
          action: {
            label: '立即验证',
            onClick: async () => {
              // Get the newly created domain ID
              const { data } = await supabase
                .from('domain_listings')
                .select('id')
                .eq('name', domainName)
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
              
              if (data?.id) {
                window.location.href = `/domain-verification/${data.id}`;
              }
            }
          }
        });
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
          onBlur={() => {
            if (domainName && !editingDomain && validateDomainName(domainName)) {
              checkDomainAvailability(domainName);
            }
          }}
          required
          className={`bg-white border-gray-300 ${nameError ? 'border-red-500' : ''}`}
          placeholder="example.com"
          disabled={editingDomain !== null} // Cannot change domain name when editing
        />
        {nameError && <p className="text-sm text-red-500 mt-1">{nameError}</p>}
        
        {isDomainChecking && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            检查域名中...
          </div>
        )}
        
        {isDomainAvailable === false && !editingDomain && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>此域名已被其他用户添加</AlertDescription>
          </Alert>
        )}
        
        {isDomainAvailable === true && !editingDomain && (
          <Alert className="py-2 bg-green-50 text-green-800 border-green-300">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>域名可以添加</AlertDescription>
          </Alert>
        )}
        
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
          onCheckedChange={(checked) => setIsHighlighted(!!checked)}
        />
        <Label htmlFor="highlight" className="text-sm font-medium text-gray-700">
          设为推荐域名（精选）
        </Label>
      </div>
      
      <Button 
        type="submit"
        disabled={formLoading || (isDomainAvailable === false && !editingDomain)}
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

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle, AlertCircle, Globe, DollarSign, Tag, FileText, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Domain {
  id: string;
  name: string;
  price: number;
  category?: string;
  description?: string;
  status?: string;
  currency?: string;
  highlight?: boolean;
}

interface DomainFormProps {
  domain?: Domain;
  onSuccess: () => void;
  onCancel: () => void;
  mode: 'add' | 'edit';
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const DomainForm = ({ 
  domain, 
  onSuccess, 
  onCancel, 
  mode, 
  isLoading, 
  setIsLoading 
}: DomainFormProps) => {
  const { user } = useAuth();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    name: domain?.name || '',
    price: domain?.price || 0,
    category: domain?.category || 'standard',
    description: domain?.description || '',
    status: domain?.status || 'available',
    currency: domain?.currency || 'CNY',
    highlight: domain?.highlight || false
  });

  useEffect(() => {
    if (domain) {
      setFormData({
        name: domain.name || '',
        price: domain.price || 0,
        category: domain.category || 'standard',
        description: domain.description || '',
        status: domain.status || 'available',
        currency: domain.currency || 'CNY',
        highlight: domain.highlight || false
      });
    }
  }, [domain]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '域名不能为空';
    } else if (!/^[a-zA-Z0-9][a-zA-Z0-9-_.]*\.[a-zA-Z]{2,}$/.test(formData.name.trim())) {
      newErrors.name = '请输入有效的域名格式（如 example.com）';
    }
    
    if (formData.price <= 0) {
      newErrors.price = '价格必须大于 0';
    } else if (formData.price > 100000000) {
      newErrors.price = '价格不能超过 1 亿';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('请修正表单中的错误');
      return;
    }
    
    if (!user) {
      toast.error('请先登录');
      return;
    }
    
    setIsLoading(true);
    setSaveSuccess(false);
    
    try {
      const domainData = {
        name: formData.name.trim().toLowerCase(),
        price: parseFloat(formData.price.toString()),
        category: formData.category,
        description: formData.description.trim(),
        status: formData.status,
        currency: formData.currency,
        highlight: formData.highlight,
      };
      
      if (mode === 'add') {
        // Check if domain already exists
        const { data: existing } = await supabase
          .from('domain_listings')
          .select('id')
          .ilike('name', domainData.name)
          .limit(1)
          .maybeSingle();
        if (existing) {
          toast.error('该域名已被添加，请检查后重试');
          setIsLoading(false);
          return;
        }
        
        const { error: insertErr } = await supabase
          .from('domain_listings')
          .insert({ ...domainData, owner_id: user.id });
        if (insertErr) throw new Error(insertErr.message);
        
        toast.success('域名已成功上架', {
          description: `${domainData.name} 已添加到您的域名列表`
        });
      } else if (mode === 'edit' && domain?.id) {
        const { name, ...updateData } = domainData;
        const { error: updateErr } = await supabase
          .from('domain_listings')
          .update(updateData)
          .eq('id', domain.id);
        if (updateErr) throw new Error(updateErr.message);
        
        toast.success('域名信息已更新', {
          description: '更改已即时生效'
        });
      }
      
      setSaveSuccess(true);
      setTimeout(() => { onSuccess(); }, 400);
      
    } catch (error: any) {
      console.error('Error submitting domain:', error);
      toast.error(error.message || '提交域名失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <AnimatePresence mode="wait">
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg text-primary"
          >
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">保存成功！</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          域名
          <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="example.com"
          required
          disabled={mode === 'edit'}
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.name}
          </p>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            价格
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="price"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            placeholder="1000"
            required
            min="1"
            className={errors.price ? 'border-destructive' : ''}
          />
          {errors.price && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.price}
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="currency">货币</Label>
          <Select 
            value={formData.currency} 
            onValueChange={(value) => handleSelectChange('currency', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择货币" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CNY">¥ 人民币</SelectItem>
              <SelectItem value="USD">$ 美元</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category" className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            分类
          </Label>
          <Select 
            value={formData.category} 
            onValueChange={(value) => handleSelectChange('category', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="premium">精品域名</SelectItem>
              <SelectItem value="standard">普通域名</SelectItem>
              <SelectItem value="short">短域名</SelectItem>
              <SelectItem value="brandable">品牌域名</SelectItem>
              <SelectItem value="numeric">数字域名</SelectItem>
              <SelectItem value="business">商业域名</SelectItem>
              <SelectItem value="keyword">关键词域名</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">销售状态</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => handleSelectChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">可售</SelectItem>
              <SelectItem value="pending">暂不出售</SelectItem>
              <SelectItem value="reserved">保留</SelectItem>
              <SelectItem value="sold">已售出</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-500" />
          <div>
            <Label className="text-sm font-medium">高亮显示</Label>
            <p className="text-xs text-muted-foreground">在列表中突出显示此域名</p>
          </div>
        </div>
        <Switch
          checked={formData.highlight}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, highlight: checked }))}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description" className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          描述
        </Label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="添加关于此域名的描述，如适用场景、关键词价值等..."
          className="w-full border border-input bg-background rounded-md p-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all text-sm"
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground text-right">
          {formData.description.length}/500
        </p>
      </div>
      
      <div className="flex justify-end gap-2 pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          取消
        </Button>
        <Button type="submit" disabled={isLoading} className="min-w-[120px]">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              提交中...
            </>
          ) : saveSuccess ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              已保存
            </>
          ) : mode === 'add' ? (
            '上架域名'
          ) : (
            '更新域名'
          )}
        </Button>
      </div>
    </form>
  );
};

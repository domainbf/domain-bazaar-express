import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from "react-i18next";
import { Loader2, CheckCircle, AlertCircle, Globe, DollarSign, Tag, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Domain {
  id: string;
  name: string;
  price: number;
  category?: string;
  description?: string;
  status?: string;
  currency?: string;
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
  const { t } = useTranslation();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    name: domain?.name || '',
    price: domain?.price || 0,
    category: domain?.category || 'standard',
    description: domain?.description || '',
    status: domain?.status || 'available',
    currency: (domain as any)?.currency || 'USD'
  });

  // 当 domain 变化时同步表单数据
  useEffect(() => {
    if (domain) {
      setFormData({
        name: domain.name || '',
        price: domain.price || 0,
        category: domain.category || 'standard',
        description: domain.description || '',
        status: domain.status || 'available',
        currency: (domain as any)?.currency || 'USD'
      });
    }
  }, [domain]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '域名名称不能为空';
    } else if (!/^[a-zA-Z0-9][a-zA-Z0-9-_.]*\.[a-zA-Z]{2,}$/.test(formData.name.trim())) {
      newErrors.name = '请输入有效的域名格式 (例如: example.com)';
    }
    
    if (formData.price <= 0) {
      newErrors.price = '价格必须大于0';
    } else if (formData.price > 100000000) {
      newErrors.price = '价格不能超过1亿';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // 清除该字段的错误
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
      toast.error(t('auth.signInRequired', '请先登录'));
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
        owner_id: user.id
      };
      
      let result;
      let newDomainId;
      
      if (mode === 'add') {
        // 检查域名是否已存在
        const { data: existingDomain } = await supabase
          .from('domain_listings')
          .select('id')
          .eq('name', domainData.name)
          .single();
        
        if (existingDomain) {
          toast.error('该域名已被添加');
          setIsLoading(false);
          return;
        }
        
        // 添加域名记录
        result = await supabase
          .from('domain_listings')
          .insert([domainData])
          .select();

        if (result.error) throw result.error;
        newDomainId = result.data?.[0]?.id;
        
        // 创建analytics记录
        if (newDomainId) {
          await supabase
            .from('domain_analytics')
            .insert({
              domain_id: newDomainId,
              views: 0,
              favorites: 0,
              offers: 0
            });
        }
        
        toast.success(t('domainActions.addDomainSuccess', '域名已成功添加'), {
          description: `${domainData.name} 已添加到您的域名列表`
        });
      } else if (mode === 'edit' && domain?.id) {
        // 更新域名
        const { name, ...updateData } = domainData; // 排除 name 字段（不允许编辑）
        result = await supabase
          .from('domain_listings')
          .update({
            ...updateData,
            // 不更新 owner_id，保持原样
          })
          .eq('id', domain.id)
          .eq('owner_id', user.id) // 确保只能更新自己的域名
          .select();
        
        if (result.error) throw result.error;
        
        if (!result.data || result.data.length === 0) {
          throw new Error('更新失败，您可能没有权限编辑此域名');
        }
        
        toast.success(t('domainActions.editDomainSuccess', '域名已成功更新'), {
          description: '更改已即时生效'
        });
      }
      
      setSaveSuccess(true);
      
      // 短暂延迟后关闭，让用户看到成功反馈
      setTimeout(() => {
        onSuccess();
      }, 500);
      
    } catch (error: any) {
      console.error('Error submitting domain:', error);
      toast.error(error.message || t('common.submitFailed', '提交域名失败'));
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
            className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700"
          >
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">保存成功！</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          {t('domainActions.domainName', '域名名称')}
          <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="example.com"
          required
          disabled={mode === 'edit'}
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.name}
          </p>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            {t('domainActions.domainPrice', '价格')}
            <span className="text-red-500">*</span>
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
            className={errors.price ? 'border-red-500' : ''}
          />
          {errors.price && (
            <p className="text-sm text-red-500 flex items-center gap-1">
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
              <SelectItem value="USD">$ 美元 (USD)</SelectItem>
              <SelectItem value="CNY">¥ 人民币 (CNY)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="category" className="flex items-center gap-2">
          <Tag className="h-4 w-4" />
          {t('domainActions.domainCategory', '分类')}
        </Label>
        <Select 
          value={formData.category} 
          onValueChange={(value) => handleSelectChange('category', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('domainFilters.category', '选择分类')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="premium">{t('domainActions.domainCategories.premium', '高级域名')}</SelectItem>
            <SelectItem value="standard">{t('domainActions.domainCategories.standard', '标准域名')}</SelectItem>
            <SelectItem value="short">{t('domainActions.domainCategories.short', '短域名')}</SelectItem>
            <SelectItem value="brandable">{t('domainActions.domainCategories.brandable', '品牌域名')}</SelectItem>
            <SelectItem value="dev">{t('domainActions.domainCategories.dev', '开发域名')}</SelectItem>
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
            <SelectItem value="sold">已售出</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          {t('domainActions.domainDescription', '描述')}
        </Label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder={t('common.addDescription', '添加关于此域名的描述...')}
          className="w-full border border-input bg-background rounded-md p-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all"
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground text-right">
          {formData.description.length}/500
        </p>
      </div>
      
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          {t('common.cancel', '取消')}
        </Button>
        <Button type="submit" disabled={isLoading} className="min-w-[120px]">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('common.submitting', '提交中...')}
            </>
          ) : saveSuccess ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              已保存
            </>
          ) : mode === 'add' ? (
            t('domainActions.addDomain', '添加域名')
          ) : (
            t('domainActions.editDomain', '更新域名')
          )}
        </Button>
      </div>
    </form>
  );
};

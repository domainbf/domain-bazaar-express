
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from "react-i18next";

interface Domain {
  id: string;
  name: string;
  price: number;
  category?: string;
  description?: string;
  status?: string;
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error(t('auth.signInRequired', '请先登录'));
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
      
      toast.success(mode === 'add' 
        ? t('domainActions.addDomainSuccess', '域名已成功添加') 
        : t('domainActions.editDomainSuccess', '域名已成功更新'));
      onSuccess();
    } catch (error: any) {
      console.error('Error submitting domain:', error);
      toast.error(error.message || t('common.submitFailed', '提交域名失败'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t('domainActions.domainName', '域名名称')}</Label>
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
        <Label htmlFor="price">{t('domainActions.domainPrice', '价格')}</Label>
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
        <Label htmlFor="category">{t('domainActions.domainCategory', '分类')}</Label>
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
        <Label htmlFor="description">{t('domainActions.domainDescription', '描述')}</Label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder={t('common.addDescription', '添加关于此域名的描述...')}
          className="w-full border border-gray-300 rounded-md p-2 min-h-[100px]"
        />
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('common.cancel', '取消')}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading 
            ? t('common.submitting', '提交中...') 
            : mode === 'add' 
              ? t('domainActions.addDomain', '添加域名') 
              : t('domainActions.editDomain', '更新域名')}
        </Button>
      </div>
    </form>
  );
};

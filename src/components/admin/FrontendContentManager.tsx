import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Phone, Mail, Image, Type, Clock, RefreshCw } from 'lucide-react';

interface FrontendConfig {
  site_name: string;
  contact_phone: string;
  contact_email: string;
  footer_text: string;
  logo_url: string;
  support_hours: string;
}

const configFields = [
  { key: 'site_name', label: '网站名称', icon: Type, placeholder: '域见•你', description: '显示在导航栏和页脚的品牌名称' },
  { key: 'contact_phone', label: '联系电话', icon: Phone, placeholder: '400-123-4567', description: '显示在联系我们页面的电话号码' },
  { key: 'contact_email', label: '联系邮箱', icon: Mail, placeholder: 'support@domain.bf', description: '显示在联系我们页面的邮箱地址' },
  { key: 'footer_text', label: '页脚文字', icon: Type, placeholder: '域见•你 域名交易平台。保留所有权利。', description: '显示在页面底部的版权文字' },
  { key: 'logo_url', label: 'Logo图片URL', icon: Image, placeholder: '/lovable-uploads/nic.png', description: '导航栏Logo图片路径或URL' },
  { key: 'support_hours', label: '服务时间', icon: Clock, placeholder: '7x24小时在线服务', description: '显示在联系页面的服务时间' },
];

export const FrontendContentManager = () => {
  const [config, setConfig] = useState<FrontendConfig>({
    site_name: '域见•你',
    contact_phone: '400-123-4567',
    contact_email: 'support@domain.bf',
    footer_text: '域见•你 域名交易平台。保留所有权利。',
    logo_url: '/lovable-uploads/nic.png',
    support_hours: '7x24小时在线服务',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const keys = configFields.map(f => f.key);
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', keys);
      
      if (error) throw error;
      
      const newConfig = { ...config };
      data?.forEach(item => {
        if (item.key in newConfig && item.value) {
          (newConfig as any)[item.key] = item.value;
        }
      });
      setConfig(newConfig);
    } catch (error) {
      console.error('加载前台配置失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      for (const field of configFields) {
        const value = (config as any)[field.key];
        
        // Upsert: try update first, then insert if not exists
        const { data: existing } = await supabase
          .from('site_settings')
          .select('id')
          .eq('key', field.key)
          .maybeSingle();
        
        if (existing) {
          const { error } = await supabase
            .from('site_settings')
            .update({ value, updated_at: new Date().toISOString() })
            .eq('key', field.key);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('site_settings')
            .insert({
              key: field.key,
              value,
              description: field.description,
              section: 'frontend',
              type: 'text',
            });
          if (error) throw error;
        }
      }
      
      toast.success('前台内容已保存，修改即时生效！');
    } catch (error: any) {
      console.error('保存失败:', error);
      toast.error('保存失败: ' + (error.message || '未知错误'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Type className="h-5 w-5" />
            前台内容管理
          </h2>
          <p className="text-sm text-muted-foreground mt-1">修改以下内容保存后即时生效到前台展示</p>
        </div>
        <Button onClick={saveConfig} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? '保存中...' : '保存并生效'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {configFields.map(field => {
          const Icon = field.icon;
          return (
            <Card key={field.key}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  {field.label}
                </CardTitle>
                <CardDescription className="text-xs">{field.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  value={(config as any)[field.key]}
                  onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                />
                {field.key === 'logo_url' && (config as any)[field.key] && (
                  <div className="mt-2 p-2 bg-muted rounded flex items-center gap-2">
                    <img 
                      src={(config as any)[field.key]} 
                      alt="Logo预览" 
                      className="h-8 w-auto"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span className="text-xs text-muted-foreground">Logo预览</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

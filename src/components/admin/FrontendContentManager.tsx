import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Phone, Mail, Image, Type, Clock, RefreshCw, Globe, BarChart3, Code, Megaphone, Layout } from 'lucide-react';

interface FieldDef {
  key: string;
  label: string;
  placeholder: string;
  description: string;
  type?: 'text' | 'textarea';
}

const brandFields: FieldDef[] = [
  { key: 'site_name', label: '网站名称', placeholder: '域见•你', description: '显示在导航栏和页脚的品牌名称' },
  { key: 'logo_url', label: 'Logo图片URL', placeholder: '/lovable-uploads/nic.png', description: '导航栏Logo图片路径或URL' },
  { key: 'favicon_url', label: 'Favicon URL', placeholder: '/favicon.ico', description: '浏览器标签栏小图标' },
  { key: 'contact_phone', label: '联系电话', placeholder: '400-123-4567', description: '联系我们页面的电话号码' },
  { key: 'contact_email', label: '联系邮箱', placeholder: 'support@example.com', description: '联系我们页面的邮箱地址' },
  { key: 'support_hours', label: '服务时间', placeholder: '7x24小时在线服务', description: '联系页面的服务时间' },
  { key: 'footer_text', label: '页脚文字', placeholder: '域见•你 域名交易平台。保留所有权利。', description: '页面底部的版权文字' },
];

const heroFields: FieldDef[] = [
  { key: 'hero_title', label: '主标题', placeholder: '找到您理想的域名', description: '首页顶部大标题' },
  { key: 'hero_subtitle', label: '副标题', placeholder: '探索、发现并获取适合您的下一个大创意的理想域名', description: '主标题下方描述' },
  { key: 'hero_search_placeholder', label: '搜索框提示', placeholder: '搜索您想要的域名...', description: '搜索框默认提示文字' },
  { key: 'hero_cta_primary', label: '主按钮文字', placeholder: '浏览域名市场', description: 'Hero区域主要按钮' },
  { key: 'hero_cta_secondary', label: '次按钮文字', placeholder: '开始出售域名', description: 'Hero区域次要按钮' },
];

const howItWorksFields: FieldDef[] = [
  { key: 'how_it_works_title', label: '板块标题', placeholder: '如何运作', description: '"如何运作"板块的标题' },
  { key: 'step1_title', label: '步骤1标题', placeholder: '搜索域名', description: '' },
  { key: 'step1_desc', label: '步骤1描述', placeholder: '在我们的平台搜索您想要的域名', description: '' },
  { key: 'step2_title', label: '步骤2标题', placeholder: '安全交易', description: '' },
  { key: 'step2_desc', label: '步骤2描述', placeholder: '通过我们安全的交易系统完成购买', description: '' },
  { key: 'step3_title', label: '步骤3标题', placeholder: '域名转移', description: '' },
  { key: 'step3_desc', label: '步骤3描述', placeholder: '快速完成域名过户到您的名下', description: '' },
];

const statsFields: FieldDef[] = [
  { key: 'stats_title', label: '统计标题', placeholder: '平台数据', description: '统计板块的大标题' },
  { key: 'stat_users', label: '活跃用户数', placeholder: '50,000+', description: '' },
  { key: 'stat_countries', label: '覆盖国家', placeholder: '100+', description: '' },
  { key: 'stat_volume', label: '交易额', placeholder: '$100M+', description: '' },
  { key: 'stat_support', label: '服务时间', placeholder: '24/7', description: '' },
];

const ctaFields: FieldDef[] = [
  { key: 'cta_title', label: 'CTA标题', placeholder: '准备好开始了吗？', description: '页面底部行动号召标题' },
  { key: 'cta_description', label: 'CTA描述', placeholder: '加入我们的域名交易平台，发现无限可能', description: '' },
  { key: 'cta_btn_primary', label: '主按钮文字', placeholder: '浏览域名', description: '' },
  { key: 'cta_btn_secondary', label: '次按钮文字', placeholder: '用户中心', description: '' },
];

const scriptFields: FieldDef[] = [
  { key: 'custom_head_script', label: 'Head自定义代码', placeholder: '<!-- Google Analytics, 百度统计等 -->', description: '插入到<head>标签内的自定义脚本（如统计代码）', type: 'textarea' },
  { key: 'custom_body_script', label: 'Body自定义代码', placeholder: '<!-- 客服系统等 -->', description: '插入到<body>底部的自定义脚本（如在线客服）', type: 'textarea' },
];

const allFields = [...brandFields, ...heroFields, ...howItWorksFields, ...statsFields, ...ctaFields, ...scriptFields];

export const FrontendContentManager = () => {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const keys = allFields.map(f => f.key);
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', keys);
      
      if (error) throw error;
      
      const newConfig: Record<string, string> = {};
      allFields.forEach(f => { newConfig[f.key] = ''; });
      data?.forEach(item => {
        if (item.value) newConfig[item.key] = item.value;
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
      for (const field of allFields) {
        const value = config[field.key] || '';
        
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
      
      toast.success('所有内容已保存，前台即时生效！');
    } catch (error: any) {
      console.error('保存失败:', error);
      toast.error('保存失败: ' + (error.message || '未知错误'));
    } finally {
      setIsSaving(false);
    }
  };

  const renderFields = (fields: FieldDef[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map(field => (
        <Card key={field.key}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{field.label}</CardTitle>
            {field.description && <CardDescription className="text-xs">{field.description}</CardDescription>}
          </CardHeader>
          <CardContent>
            {field.type === 'textarea' ? (
              <Textarea
                value={config[field.key] || ''}
                onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                rows={5}
                className="font-mono text-sm"
              />
            ) : (
              <Input
                value={config[field.key] || ''}
                onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                placeholder={field.placeholder}
              />
            )}
            {field.key === 'logo_url' && config[field.key] && (
              <div className="mt-2 p-2 bg-muted rounded flex items-center gap-2">
                <img 
                  src={config[field.key]} 
                  alt="Logo预览" 
                  className="h-8 w-auto"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <span className="text-xs text-muted-foreground">Logo预览</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

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
            <Layout className="h-5 w-5" />
            前台内容管理
          </h2>
          <p className="text-sm text-muted-foreground mt-1">修改以下内容保存后即时生效，控制首页所有文字、Logo和脚本</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadConfig}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button onClick={saveConfig} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? '保存中...' : '保存并生效'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="brand" className="w-full">
        <TabsList className="flex-wrap mb-4">
          <TabsTrigger value="brand" className="flex items-center gap-1">
            <Image className="h-3.5 w-3.5" />
            品牌信息
          </TabsTrigger>
          <TabsTrigger value="hero" className="flex items-center gap-1">
            <Globe className="h-3.5 w-3.5" />
            Hero区域
          </TabsTrigger>
          <TabsTrigger value="howitworks" className="flex items-center gap-1">
            <Type className="h-3.5 w-3.5" />
            如何运作
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-1">
            <BarChart3 className="h-3.5 w-3.5" />
            数据统计
          </TabsTrigger>
          <TabsTrigger value="cta" className="flex items-center gap-1">
            <Megaphone className="h-3.5 w-3.5" />
            行动号召
          </TabsTrigger>
          <TabsTrigger value="scripts" className="flex items-center gap-1">
            <Code className="h-3.5 w-3.5" />
            自定义脚本
          </TabsTrigger>
        </TabsList>

        <TabsContent value="brand">{renderFields(brandFields)}</TabsContent>
        <TabsContent value="hero">{renderFields(heroFields)}</TabsContent>
        <TabsContent value="howitworks">{renderFields(howItWorksFields)}</TabsContent>
        <TabsContent value="stats">{renderFields(statsFields)}</TabsContent>
        <TabsContent value="cta">{renderFields(ctaFields)}</TabsContent>
        <TabsContent value="scripts">{renderFields(scriptFields)}</TabsContent>
      </Tabs>
    </div>
  );
};

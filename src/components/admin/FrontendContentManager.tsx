import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useRef } from 'react';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Image, Type, RefreshCw, Globe, BarChart3, Code, Megaphone, Layout, Upload, Loader2, ExternalLink, Building2 } from 'lucide-react';

interface FieldDef {
  key: string;
  label: string;
  placeholder: string;
  description: string;
  type?: 'text' | 'textarea';
}

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

const allExtraFields = [...heroFields, ...howItWorksFields, ...statsFields, ...ctaFields, ...scriptFields];

const BRAND_KEYS = [
  'site_name', 'site_domain', 'logo_url', 'favicon_url',
  'footer_text', 'contact_phone', 'contact_email',
  'contact_address', 'emergency_phone', 'support_hours',
];

export const FrontendContentManager = () => {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const allKeys = [...BRAND_KEYS, ...allExtraFields.map(f => f.key)];

  useEffect(() => { loadConfig(); }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', allKeys);
      if (error) throw error;
      const newConfig: Record<string, string> = {};
      allKeys.forEach(k => { newConfig[k] = ''; });
      data?.forEach(item => { if (item.value) newConfig[item.key] = item.value; });
      setConfig(newConfig);
    } catch (error) {
      console.error('加载前台配置失败:', error);
      toast.error('加载配置失败');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSingleKey = async (key: string, value: string, description = '') => {
    const { data: existing } = await supabase
      .from('site_settings')
      .select('id')
      .eq('key', key)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase
        .from('site_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('site_settings')
        .insert({ key, value, description, section: 'frontend', type: 'text' });
      if (error) throw error;
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      for (const key of allKeys) {
        const fieldDef = allExtraFields.find(f => f.key === key);
        await saveSingleKey(key, config[key] || '', fieldDef?.description || '');
      }
      toast.success('所有内容已保存，前台即时生效！');
    } catch (error: any) {
      console.error('保存失败:', error);
      toast.error('保存失败: ' + (error.message || '未知错误'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('文件大小不能超过 2MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件（PNG、JPG、SVG、WebP）');
      return;
    }
    setIsUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const fileName = `logo-${Date.now()}.${ext}`;

      const buckets = ['logos', 'avatars'];
      let publicUrl = '';

      for (const bucket of buckets) {
        const path = bucket === 'avatars' ? `logos/${fileName}` : fileName;
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, file, { cacheControl: '86400', upsert: true });

        if (!uploadError) {
          const { data: { publicUrl: url } } = supabase.storage.from(bucket).getPublicUrl(path);
          publicUrl = url;
          break;
        }
        const msg = uploadError.message.toLowerCase();
        if (!msg.includes('bucket') && !msg.includes('not found') && !msg.includes('no such')) {
          throw uploadError;
        }
      }

      if (!publicUrl) {
        throw new Error('存储桶不可用。请在 Supabase 控制台 → Storage 中创建名为 "logos" 的公开存储桶，或直接在下方粘贴图片URL。');
      }

      await saveSingleKey('logo_url', publicUrl, 'Logo图片URL');
      setConfig(c => ({ ...c, logo_url: publicUrl }));
      toast.success('Logo 上传成功！');
    } catch (error: any) {
      toast.error(error.message || 'Logo 上传失败');
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
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
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {isSaving ? '保存中...' : '保存并生效'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="brand" className="w-full">
        <TabsList className="flex-wrap mb-4">
          <TabsTrigger value="brand" className="flex items-center gap-1">
            <Image className="h-3.5 w-3.5" />
            品牌与联系
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

        {/* ── Brand & Contact Tab ── */}
        <TabsContent value="brand" className="space-y-6">

          {/* Logo Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                网站 Logo
              </CardTitle>
              <CardDescription>上传品牌Logo图片（PNG、SVG、WebP，最大 2MB），将显示在导航栏</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preview */}
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl border border-border">
                <div className="w-20 h-20 rounded-xl border border-border bg-background flex items-center justify-center overflow-hidden shrink-0">
                  {config.logo_url ? (
                    <img
                      src={config.logo_url}
                      alt="Logo预览"
                      className="h-full w-full object-contain p-2"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <Image className="h-8 w-8 text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium">
                    {config.logo_url ? '当前 Logo' : '未设置 Logo，将显示网站名称文字'}
                  </p>
                  {config.logo_url && (
                    <p className="text-xs text-muted-foreground truncate">{config.logo_url}</p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file);
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isUploadingLogo}
                    >
                      {isUploadingLogo
                        ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />上传中...</>
                        : <><Upload className="h-3.5 w-3.5 mr-1.5" />上传图片</>
                      }
                    </Button>
                    {config.logo_url && (
                      <Button size="sm" variant="ghost" asChild>
                        <a href={config.logo_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />查看
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Manual URL fallback */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">或直接输入图片URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={config.logo_url || ''}
                    onChange={(e) => setConfig(c => ({ ...c, logo_url: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Favicon */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Favicon URL <span className="text-muted-foreground font-normal">（浏览器标签小图标）</span></Label>
                <Input
                  value={config.favicon_url || ''}
                  onChange={(e) => setConfig(c => ({ ...c, favicon_url: e.target.value }))}
                  placeholder="/favicon.ico"
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Site Identity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                网站基本信息
              </CardTitle>
              <CardDescription>网站名称、域名和页脚版权文字</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-semibold">网站名称 <span className="text-destructive">*</span></Label>
                  <p className="text-xs text-muted-foreground">显示在导航栏和页脚的品牌名称</p>
                  <Input
                    value={config.site_name || ''}
                    onChange={(e) => setConfig(c => ({ ...c, site_name: e.target.value }))}
                    placeholder="域见•你"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold">网站域名 <span className="text-destructive">*</span></Label>
                  <p className="text-xs text-muted-foreground">含协议，用于邮件中的链接（如 https://yourdomain.com）</p>
                  <Input
                    value={config.site_domain || ''}
                    onChange={(e) => setConfig(c => ({ ...c, site_domain: e.target.value }))}
                    placeholder="https://yourdomain.com"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">页脚版权文字</Label>
                <p className="text-xs text-muted-foreground">显示在页面底部的版权信息</p>
                <Input
                  value={config.footer_text || ''}
                  onChange={(e) => setConfig(c => ({ ...c, footer_text: e.target.value }))}
                  placeholder="域见•你 域名交易平台。保留所有权利。"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                联系方式
              </CardTitle>
              <CardDescription>显示在联系我们页面及页脚的联系信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-semibold">客服电话</Label>
                  <Input
                    value={config.contact_phone || ''}
                    onChange={(e) => setConfig(c => ({ ...c, contact_phone: e.target.value }))}
                    placeholder="+86-400-123-4567"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold">紧急联系电话</Label>
                  <Input
                    value={config.emergency_phone || ''}
                    onChange={(e) => setConfig(c => ({ ...c, emergency_phone: e.target.value }))}
                    placeholder="+86-400-999-0000"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold">客服邮箱</Label>
                  <Input
                    type="email"
                    value={config.contact_email || ''}
                    onChange={(e) => setConfig(c => ({ ...c, contact_email: e.target.value }))}
                    placeholder="support@yourdomain.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold">服务时间</Label>
                  <Input
                    value={config.support_hours || ''}
                    onChange={(e) => setConfig(c => ({ ...c, support_hours: e.target.value }))}
                    placeholder="7x24小时在线服务"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">公司/团队地址</Label>
                <Textarea
                  value={config.contact_address || ''}
                  onChange={(e) => setConfig(c => ({ ...c, contact_address: e.target.value }))}
                  placeholder="例：文莱达鲁萨兰国斯里巴加湾市"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hero">{renderFields(heroFields)}</TabsContent>
        <TabsContent value="howitworks">{renderFields(howItWorksFields)}</TabsContent>
        <TabsContent value="stats">{renderFields(statsFields)}</TabsContent>
        <TabsContent value="cta">{renderFields(ctaFields)}</TabsContent>
        <TabsContent value="scripts">{renderFields(scriptFields)}</TabsContent>
      </Tabs>
    </div>
  );
};

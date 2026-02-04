import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, Globe, FileText, Tag, RefreshCw, Save, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface SeoSetting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
  section: string | null;
  type: string | null;
}

export const SeoConfiguration = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({
    meta_title: '',
    meta_description: '',
    keywords: '',
    og_title: '',
    og_description: '',
    og_image: '',
    twitter_card: 'summary_large_image',
    canonical_url: '',
    robots: 'index, follow',
    author: '',
    site_name: '',
    google_verification: '',
    bing_verification: ''
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('section', 'seo');

      if (error) throw error;

      const loadedSettings = { ...settings };
      (data || []).forEach((setting: SeoSetting) => {
        if (setting.key in loadedSettings) {
          loadedSettings[setting.key] = setting.value || '';
        }
      });
      setSettings(loadedSettings);
      setHasChanges(false);
    } catch (error: any) {
      console.error('Error loading SEO settings:', error);
      toast.error('加载SEO设置失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        section: 'seo',
        type: 'text',
        description: getSeoFieldDescription(key),
        updated_at: new Date().toISOString()
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('site_settings')
          .upsert(update, { 
            onConflict: 'key' 
          });

        if (error) {
          console.error('Error saving setting:', update.key, error);
          throw error;
        }
      }

      toast.success('SEO设置保存成功');
      setHasChanges(false);
    } catch (error: any) {
      console.error('Error saving SEO settings:', error);
      toast.error(error.message || '保存SEO设置失败');
    } finally {
      setIsSaving(false);
    }
  };

  const getSeoFieldDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      meta_title: '网站标题，显示在浏览器标签页',
      meta_description: '网站描述，用于搜索引擎结果显示',
      keywords: '网站关键词，用逗号分隔',
      og_title: 'Open Graph标题，用于社交分享',
      og_description: 'Open Graph描述，用于社交分享',
      og_image: 'Open Graph图片URL，用于社交分享',
      twitter_card: 'Twitter卡片类型',
      canonical_url: '规范链接URL',
      robots: '搜索引擎爬虫指令',
      author: '网站作者',
      site_name: '网站名称',
      google_verification: 'Google搜索验证码',
      bing_verification: 'Bing搜索验证码'
    };
    return descriptions[key] || '';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl font-semibold">SEO配置</h2>
          {hasChanges && (
            <Badge variant="secondary" className="ml-2">
              <AlertCircle className="h-3 w-3 mr-1" />
              未保存的更改
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSettings} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button onClick={saveSettings} disabled={isSaving || !hasChanges}>
            {isSaving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            保存更改
          </Button>
        </div>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">SEO优化提示</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>标题长度建议在50-60个字符之间</li>
              <li>描述长度建议在150-160个字符之间</li>
              <li>关键词用英文逗号分隔，建议5-10个核心关键词</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            基础设置
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            社交分享
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            高级设置
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>基础SEO设置</CardTitle>
              <CardDescription>配置网站的基本元数据，用于搜索引擎优化</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="site_name">网站名称</Label>
                <Input
                  id="site_name"
                  value={settings.site_name}
                  onChange={(e) => handleChange('site_name', e.target.value)}
                  placeholder="例如：NIC.BN 域名交易平台"
                />
                <p className="text-xs text-muted-foreground">网站的品牌名称</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_title">
                  页面标题 (Meta Title)
                  <span className="text-xs text-muted-foreground ml-2">
                    {settings.meta_title.length}/60 字符
                  </span>
                </Label>
                <Input
                  id="meta_title"
                  value={settings.meta_title}
                  onChange={(e) => handleChange('meta_title', e.target.value)}
                  placeholder="例如：NIC.BN - 优质域名交易平台"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">显示在浏览器标签页和搜索结果中的标题</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_description">
                  页面描述 (Meta Description)
                  <span className="text-xs text-muted-foreground ml-2">
                    {settings.meta_description.length}/160 字符
                  </span>
                </Label>
                <Textarea
                  id="meta_description"
                  value={settings.meta_description}
                  onChange={(e) => handleChange('meta_description', e.target.value)}
                  placeholder="例如：NIC.BN是专业的域名交易平台，提供优质域名买卖、估价、托管等服务..."
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground">搜索结果中显示的网站描述</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">关键词 (Keywords)</Label>
                <Textarea
                  id="keywords"
                  value={settings.keywords}
                  onChange={(e) => handleChange('keywords', e.target.value)}
                  placeholder="例如：域名交易, 域名买卖, 域名估价, 优质域名, 短域名, premium domain"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">用英文逗号分隔的关键词列表</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="author">作者 / 公司</Label>
                <Input
                  id="author"
                  value={settings.author}
                  onChange={(e) => handleChange('author', e.target.value)}
                  placeholder="例如：NIC.BN Team"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>社交分享设置</CardTitle>
              <CardDescription>配置在社交平台分享时显示的内容</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="og_title">Open Graph 标题</Label>
                <Input
                  id="og_title"
                  value={settings.og_title}
                  onChange={(e) => handleChange('og_title', e.target.value)}
                  placeholder="社交分享时显示的标题"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="og_description">Open Graph 描述</Label>
                <Textarea
                  id="og_description"
                  value={settings.og_description}
                  onChange={(e) => handleChange('og_description', e.target.value)}
                  placeholder="社交分享时显示的描述"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="og_image">Open Graph 图片URL</Label>
                <Input
                  id="og_image"
                  value={settings.og_image}
                  onChange={(e) => handleChange('og_image', e.target.value)}
                  placeholder="https://example.com/og-image.png"
                />
                <p className="text-xs text-muted-foreground">建议尺寸：1200x630像素</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter_card">Twitter Card 类型</Label>
                <Input
                  id="twitter_card"
                  value={settings.twitter_card}
                  onChange={(e) => handleChange('twitter_card', e.target.value)}
                  placeholder="summary_large_image"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>高级设置</CardTitle>
              <CardDescription>搜索引擎验证和爬虫指令配置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="canonical_url">规范链接 (Canonical URL)</Label>
                <Input
                  id="canonical_url"
                  value={settings.canonical_url}
                  onChange={(e) => handleChange('canonical_url', e.target.value)}
                  placeholder="https://nic.bn"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="robots">Robots指令</Label>
                <Input
                  id="robots"
                  value={settings.robots}
                  onChange={(e) => handleChange('robots', e.target.value)}
                  placeholder="index, follow"
                />
                <p className="text-xs text-muted-foreground">控制搜索引擎爬虫行为</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="google_verification">Google Search Console 验证码</Label>
                <Input
                  id="google_verification"
                  value={settings.google_verification}
                  onChange={(e) => handleChange('google_verification', e.target.value)}
                  placeholder="google-site-verification=xxxx"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bing_verification">Bing Webmaster 验证码</Label>
                <Input
                  id="bing_verification"
                  value={settings.bing_verification}
                  onChange={(e) => handleChange('bing_verification', e.target.value)}
                  placeholder="msvalidate.01=xxxx"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 预览卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            搜索结果预览
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white border rounded-lg p-4 max-w-xl">
            <div className="text-blue-600 text-lg hover:underline cursor-pointer">
              {settings.meta_title || '您的网站标题'}
            </div>
            <div className="text-green-700 text-sm">
              {settings.canonical_url || 'https://nic.bn'} ›
            </div>
            <div className="text-gray-600 text-sm mt-1">
              {settings.meta_description || '您的网站描述将显示在这里...'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SeoConfiguration;

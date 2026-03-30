import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, RefreshCw, FileText, Eye, EyeOff, Trash2, ExternalLink } from 'lucide-react';

interface LegalPage {
  key: string;
  label: string;
  route: string;
  description: string;
  placeholder: string;
}

const LEGAL_PAGES: LegalPage[] = [
  {
    key: 'legal_terms_content',
    label: '服务条款',
    route: '/terms',
    description: '用户服务协议，规定平台使用规则和双方权利义务',
    placeholder: `第一条 总则\n本平台服务条款适用于所有注册用户...\n\n第二条 用户注册\n用户注册时需提供真实有效的个人信息...`,
  },
  {
    key: 'legal_privacy_content',
    label: '隐私政策',
    route: '/privacy',
    description: '说明平台如何收集、使用和保护用户个人信息',
    placeholder: `第一条 信息收集\n我们收集以下类型的用户信息...\n\n第二条 信息使用\n我们使用收集到的信息用于以下目的...`,
  },
  {
    key: 'legal_disclaimer_content',
    label: '免责声明',
    route: '/disclaimer',
    description: '声明平台的责任限制及风险提示',
    placeholder: `一、平台性质\n本平台仅提供域名信息展示和交易撮合服务...\n\n二、风险提示\n域名交易存在市场风险，交易前请充分了解...`,
  },
];

const upsertSetting = async (key: string, value: string) => {
  const { data: existing } = await supabase
    .from('site_settings')
    .select('id')
    .eq('key', key)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('site_settings')
      .update({ value, updated_at: new Date().toISOString() } as any)
      .eq('key', key);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('site_settings')
      .insert({ key, value } as any);
    if (error) throw error;
  }
};

export const AdminLegalPagesManager = () => {
  const [contents, setContents] = useState<Record<string, string>>({
    legal_terms_content: '',
    legal_privacy_content: '',
    legal_disclaimer_content: '',
  });
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [previewing, setPreviewing] = useState<string | null>(null);

  useEffect(() => {
    loadContents();
  }, []);

  const loadContents = async () => {
    setIsLoading(true);
    try {
      const keys = LEGAL_PAGES.map(p => p.key);
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', keys);
      if (error) throw error;

      const loaded: Record<string, string> = {};
      data?.forEach(item => {
        if (item.value) loaded[item.key] = item.value;
      });
      setContents(prev => ({ ...prev, ...loaded }));
    } catch (error: any) {
      toast.error('加载内容失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (page: LegalPage) => {
    setSaving(prev => ({ ...prev, [page.key]: true }));
    try {
      await upsertSetting(page.key, contents[page.key]);
      toast.success(`"${page.label}"内容已保存，前台即时生效`);
    } catch (error: any) {
      toast.error('保存失败: ' + error.message);
    } finally {
      setSaving(prev => ({ ...prev, [page.key]: false }));
    }
  };

  const handleClear = async (page: LegalPage) => {
    if (!confirm(`确定要清除"${page.label}"的自定义内容吗？\n清除后将显示系统默认内容。`)) return;
    setSaving(prev => ({ ...prev, [page.key]: true }));
    try {
      await upsertSetting(page.key, '');
      setContents(prev => ({ ...prev, [page.key]: '' }));
      toast.success(`"${page.label}"已恢复为默认内容`);
    } catch (error: any) {
      toast.error('操作失败: ' + error.message);
    } finally {
      setSaving(prev => ({ ...prev, [page.key]: false }));
    }
  };

  const charCount = (key: string) => contents[key]?.length ?? 0;
  const hasCustomContent = (key: string) => (contents[key]?.trim().length ?? 0) > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">加载法律页面内容...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">法律页面管理</h2>
          <p className="text-muted-foreground mt-1">编辑服务条款、隐私政策和免责声明的内容，保存后立即在前台生效</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadContents}>
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <strong>使用说明：</strong>在下方输入框中填写内容，支持换行分段。
          保存后前台页面即时更新，无需刷新。留空则显示系统默认内容。
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="terms">
        <TabsList className="grid w-full grid-cols-3">
          {LEGAL_PAGES.map(page => (
            <TabsTrigger key={page.key} value={page.key.replace('legal_', '').replace('_content', '')}>
              {page.label}
              {hasCustomContent(page.key) && (
                <Badge variant="secondary" className="ml-2 h-4 text-xs px-1">已自定义</Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {LEGAL_PAGES.map(page => {
          const tabValue = page.key.replace('legal_', '').replace('_content', '');
          const isPreviewingThis = previewing === page.key;
          return (
            <TabsContent key={page.key} value={tabValue} className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {page.label}
                        <a
                          href={page.route}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          {page.route} <ExternalLink className="h-3 w-3" />
                        </a>
                      </CardTitle>
                      <CardDescription className="mt-1">{page.description}</CardDescription>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewing(isPreviewingThis ? null : page.key)}
                      >
                        {isPreviewingThis ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                        {isPreviewingThis ? '隐藏预览' : '预览'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isPreviewingThis && hasCustomContent(page.key) && (
                    <div className="rounded-lg border bg-muted/30 p-4 max-h-64 overflow-y-auto">
                      <p className="text-xs font-medium text-muted-foreground mb-2">内容预览</p>
                      {contents[page.key].split('\n\n').map((para, i) => (
                        <p key={i} className="text-sm mb-3 whitespace-pre-wrap">{para}</p>
                      ))}
                    </div>
                  )}
                  {isPreviewingThis && !hasCustomContent(page.key) && (
                    <div className="rounded-lg border bg-amber-500/10 dark:bg-amber-950/20 p-4">
                      <p className="text-sm text-amber-700 dark:text-amber-400">当前使用系统默认内容，在下方输入自定义内容后保存即可覆盖。</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        自定义内容
                        {!hasCustomContent(page.key) && (
                          <span className="ml-2 text-xs text-muted-foreground">（当前显示默认内容）</span>
                        )}
                      </label>
                      <span className="text-xs text-muted-foreground">{charCount(page.key)} 字符</span>
                    </div>
                    <Textarea
                      value={contents[page.key]}
                      onChange={e => setContents(prev => ({ ...prev, [page.key]: e.target.value }))}
                      placeholder={page.placeholder}
                      className="min-h-[320px] font-mono text-sm resize-y"
                      data-testid={`textarea-legal-${tabValue}`}
                    />
                    <p className="text-xs text-muted-foreground">
                      提示：使用空行（双回车）分隔段落，内容将按段落格式渲染到前台页面。
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => handleSave(page)}
                      disabled={saving[page.key]}
                      data-testid={`btn-save-legal-${tabValue}`}
                    >
                      {saving[page.key] ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      保存并发布
                    </Button>
                    {hasCustomContent(page.key) && (
                      <Button
                        variant="outline"
                        onClick={() => handleClear(page)}
                        disabled={saving[page.key]}
                        data-testid={`btn-clear-legal-${tabValue}`}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        恢复默认
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

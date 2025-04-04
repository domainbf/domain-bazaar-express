
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Globe, Mail, PieChart, Layout, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SiteSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
  section: string;
  type: string;
}

interface SiteContent {
  id: string;
  key: string;
  content: string;
  section: string;
  type: string;
}

export const SiteSettings = () => {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [contents, setContents] = useState<SiteContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savingContent, setSavingContent] = useState(false);

  useEffect(() => {
    loadSettings();
    loadSiteContents();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .order('section', { ascending: true });
      
      if (error) throw error;
      
      setSettings(data || []);
    } catch (error: any) {
      console.error('加载网站设置时出错:', error);
      toast.error(error.message || '加载网站设置失败');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSiteContents = async () => {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .order('section', { ascending: true });
      
      if (error) throw error;
      
      setContents(data || []);
    } catch (error: any) {
      console.error('加载网站内容时出错:', error);
      toast.error(error.message || '加载网站内容失败');
    }
  };

  const handleSettingChange = (id: string, value: string) => {
    setSettings(
      settings.map((setting) => 
        setting.id === id ? { ...setting, value } : setting
      )
    );
  };

  const handleContentChange = (id: string, content: string) => {
    setContents(
      contents.map((item) => 
        item.id === id ? { ...item, content } : item
      )
    );
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Update each setting in the database
      for (const setting of settings) {
        const { error } = await supabase
          .from('site_settings')
          .update({ value: setting.value })
          .eq('id', setting.id);
        
        if (error) throw error;
      }
      
      toast.success('设置已成功保存');
    } catch (error: any) {
      console.error('保存设置时出错:', error);
      toast.error(error.message || '保存设置失败');
    } finally {
      setIsSaving(false);
    }
  };

  const saveContents = async () => {
    setSavingContent(true);
    try {
      // Update each content item in the database
      for (const content of contents) {
        const { error } = await supabase
          .from('site_content')
          .update({ content: content.content })
          .eq('id', content.id);
        
        if (error) throw error;
      }
      
      toast.success('网站内容已成功保存');
    } catch (error: any) {
      console.error('保存网站内容时出错:', error);
      toast.error(error.message || '保存网站内容失败');
    } finally {
      setSavingContent(false);
    }
  };
  
  const createNewContentItem = async (key: string, section: string, initialContent: string = '') => {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .insert({
          key,
          section,
          content: initialContent,
          type: 'text'
        })
        .select();
      
      if (error) throw error;
      
      setContents([...contents, data[0]]);
      toast.success('新内容项已创建');
    } catch (error: any) {
      console.error('创建内容项时出错:', error);
      toast.error(error.message || '创建内容项失败');
    }
  };

  const getSettingsBySection = (section: string) => {
    return settings.filter(setting => setting.section === section);
  };

  const getContentsBySection = (section: string) => {
    return contents.filter(content => content.section === section);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl font-semibold">网站设置</h2>
        </div>
        <Button 
          onClick={saveSettings} 
          disabled={isSaving}
          className="bg-black hover:bg-gray-800"
        >
          {isSaving ? '保存中...' : '保存所有设置'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            常规设置
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            邮件设置
          </TabsTrigger>
          <TabsTrigger value="seo">
            <Globe className="h-4 w-4 mr-2" />
            SEO设置
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <PieChart className="h-4 w-4 mr-2" />
            统计设置
          </TabsTrigger>
          <TabsTrigger value="content">
            <Layout className="h-4 w-4 mr-2" />
            网站内容
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <div className="grid grid-cols-1 gap-6">
            {getSettingsBySection('general').length === 0 ? (
              <Alert>
                <AlertDescription className="text-center py-8">
                  尚未设置任何常规设置。点击下方按钮添加新设置。
                </AlertDescription>
              </Alert>
            ) : (
              getSettingsBySection('general').map(setting => (
                <SettingCard 
                  key={setting.id}
                  setting={setting}
                  onChange={(value) => handleSettingChange(setting.id, value)}
                />
              ))
            )}
            <Button 
              variant="outline" 
              onClick={() => createSiteSetting('general')}
              className="w-full"
            >
              添加设置项
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="email">
          <div className="grid grid-cols-1 gap-6">
            {getSettingsBySection('email').length === 0 ? (
              <Alert>
                <AlertDescription className="text-center py-8">
                  尚未设置任何邮件设置。点击下方按钮添加新设置。
                </AlertDescription>
              </Alert>
            ) : (
              getSettingsBySection('email').map(setting => (
                <SettingCard 
                  key={setting.id}
                  setting={setting}
                  onChange={(value) => handleSettingChange(setting.id, value)}
                />
              ))
            )}
            <Button 
              variant="outline" 
              onClick={() => createSiteSetting('email')}
              className="w-full"
            >
              添加设置项
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="seo">
          <div className="grid grid-cols-1 gap-6">
            {getSettingsBySection('seo').length === 0 ? (
              <Alert>
                <AlertDescription className="text-center py-8">
                  尚未设置任何SEO设置。点击下方按钮添加新设置。
                </AlertDescription>
              </Alert>
            ) : (
              getSettingsBySection('seo').map(setting => (
                <SettingCard 
                  key={setting.id}
                  setting={setting}
                  onChange={(value) => handleSettingChange(setting.id, value)}
                />
              ))
            )}
            <Button 
              variant="outline" 
              onClick={() => createSiteSetting('seo')}
              className="w-full"
            >
              添加设置项
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 gap-6">
            {getSettingsBySection('analytics').length === 0 ? (
              <Alert>
                <AlertDescription className="text-center py-8">
                  尚未设置任何统计设置。点击下方按钮添加新设置。
                </AlertDescription>
              </Alert>
            ) : (
              getSettingsBySection('analytics').map(setting => (
                <SettingCard 
                  key={setting.id}
                  setting={setting}
                  onChange={(value) => handleSettingChange(setting.id, value)}
                />
              ))
            )}
            <Button 
              variant="outline" 
              onClick={() => createSiteSetting('analytics')}
              className="w-full"
            >
              添加设置项
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="content">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <FileText className="h-5 w-5" />
                网站文本内容管理
              </h3>
              <Button 
                onClick={saveContents} 
                disabled={savingContent}
                className="bg-black hover:bg-gray-800"
              >
                {savingContent ? '保存中...' : '保存所有内容'}
              </Button>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">网站头部内容</h4>
              {getContentsBySection('header').length === 0 ? (
                <Alert>
                  <AlertDescription className="text-center py-4">
                    尚未设置任何头部内容。
                  </AlertDescription>
                </Alert>
              ) : (
                getContentsBySection('header').map(content => (
                  <ContentCard 
                    key={content.id}
                    content={content}
                    onChange={(value) => handleContentChange(content.id, value)}
                  />
                ))
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => createNewContentItem('logo_text', 'header', 'NIC.BN')}
              >
                添加头部内容
              </Button>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">首页内容</h4>
              {getContentsBySection('home').length === 0 ? (
                <Alert>
                  <AlertDescription className="text-center py-4">
                    尚未设置任何首页内容。
                  </AlertDescription>
                </Alert>
              ) : (
                getContentsBySection('home').map(content => (
                  <ContentCard 
                    key={content.id}
                    content={content}
                    onChange={(value) => handleContentChange(content.id, value)}
                  />
                ))
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => createNewContentItem('hero_title', 'home', '欢迎来到NIC.BN域名交易平台')}
              >
                添加首页内容
              </Button>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">页脚内容</h4>
              {getContentsBySection('footer').length === 0 ? (
                <Alert>
                  <AlertDescription className="text-center py-4">
                    尚未设置任何页脚内容。
                  </AlertDescription>
                </Alert>
              ) : (
                getContentsBySection('footer').map(content => (
                  <ContentCard 
                    key={content.id}
                    content={content}
                    onChange={(value) => handleContentChange(content.id, value)}
                  />
                ))
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => createNewContentItem('copyright', 'footer', '© NIC.BN 保留所有权利')}
              >
                添加页脚内容
              </Button>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">其他内容</h4>
              {getContentsBySection('other').length === 0 ? (
                <Alert>
                  <AlertDescription className="text-center py-4">
                    尚未设置任何其他内容。
                  </AlertDescription>
                </Alert>
              ) : (
                getContentsBySection('other').map(content => (
                  <ContentCard 
                    key={content.id}
                    content={content}
                    onChange={(value) => handleContentChange(content.id, value)}
                  />
                ))
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => createNewContentItem('about_us', 'other', '关于我们的信息')}
              >
                添加其他内容
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
  
  // Function to create a new site setting
  function createSiteSetting(section: string) {
    const key = prompt('请输入设置项的键名（英文，如site_title）');
    if (!key) return;
    
    const description = prompt('请输入设置项的描述（可选）');
    const value = prompt('请输入设置项的初始值（可选）') || '';
    
    supabase
      .from('site_settings')
      .insert({
        key,
        description,
        value,
        section,
        type: 'text'
      })
      .select()
      .then(({ data, error }) => {
        if (error) {
          toast.error('创建设置项失败：' + error.message);
          return;
        }
        
        if (data) {
          setSettings([...settings, data[0]]);
          toast.success('设置项创建成功');
        }
      });
  }
};

// Setting Card Component
interface SettingCardProps {
  setting: SiteSetting;
  onChange: (value: string) => void;
}

const SettingCard = ({ setting, onChange }: SettingCardProps) => {
  const renderSettingInput = () => {
    switch (setting.type) {
      case 'textarea':
        return (
          <Textarea
            id={setting.key}
            value={setting.value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full"
            rows={4}
          />
        );
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Input
              type="checkbox"
              id={setting.key}
              checked={setting.value === 'true'}
              onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
              className="w-4 h-4"
            />
            <label htmlFor={setting.key} className="text-sm font-medium text-gray-700">
              {setting.value === 'true' ? '启用' : '禁用'}
            </label>
          </div>
        );
      default:
        return (
          <Input
            id={setting.key}
            value={setting.value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full"
          />
        );
    }
  };

  return (
    <Card className="w-full shadow-sm border border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          {setting.key}
        </CardTitle>
        {setting.description && (
          <CardDescription>{setting.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {renderSettingInput()}
      </CardContent>
    </Card>
  );
};

// Content Card Component
interface ContentCardProps {
  content: SiteContent;
  onChange: (value: string) => void;
}

const ContentCard = ({ content, onChange }: ContentCardProps) => {
  return (
    <Card className="w-full shadow-sm border border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          {content.key}
        </CardTitle>
        <CardDescription>
          区域: {content.section} | 类型: {content.type}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {content.type === 'html' ? (
          <Textarea
            value={content.content || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full font-mono text-sm"
            rows={8}
          />
        ) : (
          <Textarea
            value={content.content || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full"
            rows={4}
          />
        )}
      </CardContent>
    </Card>
  );
};

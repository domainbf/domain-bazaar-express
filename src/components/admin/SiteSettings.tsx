
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Globe, Mail, PieChart } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SiteSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
  section: string;
  type: string;
}

export const SiteSettings = () => {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newSetting, setNewSetting] = useState({ key: '', value: '', description: '', section: 'general', type: 'text' });

  useEffect(() => {
    loadSettings();
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

  const handleSettingChange = (id: string, value: string) => {
    setSettings(
      settings.map((setting) => 
        setting.id === id ? { ...setting, value } : setting
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

  const addNewSetting = async () => {
    if (!newSetting.key.trim()) {
      toast.error('请输入设置键名');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('site_settings')
        .insert([newSetting])
        .select()
        .single();

      if (error) throw error;

      setSettings([...settings, data]);
      setNewSetting({ key: '', value: '', description: '', section: 'general', type: 'text' });
      toast.success('新设置项已添加');
    } catch (error: any) {
      console.error('添加设置项时出错:', error);
      toast.error(error.message || '添加设置项失败');
    }
  };

  const deleteSetting = async (id: string) => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSettings(settings.filter(s => s.id !== id));
      toast.success('设置项已删除');
    } catch (error: any) {
      console.error('删除设置项时出错:', error);
      toast.error(error.message || '删除设置项失败');
    }
  };

  const getSettingsBySection = (section: string) => {
    return settings.filter(setting => setting.section === section);
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
        </TabsList>
        
        <TabsContent value="general">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>添加新设置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">设置键名</label>
                    <Input
                      value={newSetting.key}
                      onChange={(e) => setNewSetting({...newSetting, key: e.target.value})}
                      placeholder="例如: site_title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">设置值</label>
                    <Input
                      value={newSetting.value}
                      onChange={(e) => setNewSetting({...newSetting, value: e.target.value})}
                      placeholder="设置值"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">描述</label>
                    <Input
                      value={newSetting.description}
                      onChange={(e) => setNewSetting({...newSetting, description: e.target.value})}
                      placeholder="设置描述"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">类型</label>
                    <select
                      value={newSetting.type}
                      onChange={(e) => setNewSetting({...newSetting, type: e.target.value})}
                      className="w-full p-2 border rounded"
                    >
                      <option value="text">文本</option>
                      <option value="textarea">长文本</option>
                      <option value="boolean">布尔值</option>
                    </select>
                  </div>
                </div>
                <Button onClick={addNewSetting} className="w-full">
                  添加设置项
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6">
              {getSettingsBySection('general').length === 0 ? (
                <p className="text-gray-500 text-center py-8">尚未设置任何常规设置</p>
              ) : (
                getSettingsBySection('general').map(setting => (
                  <SettingCard 
                    key={setting.id}
                    setting={setting}
                    onChange={(value) => handleSettingChange(setting.id, value)}
                    onDelete={() => deleteSetting(setting.id)}
                  />
                ))
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="email">
          <div className="grid grid-cols-1 gap-6">
            {getSettingsBySection('email').length === 0 ? (
              <p className="text-gray-500 text-center py-8">尚未设置任何邮件设置</p>
            ) : (
              getSettingsBySection('email').map(setting => (
                <SettingCard 
                  key={setting.id}
                  setting={setting}
                  onChange={(value) => handleSettingChange(setting.id, value)}
                />
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="seo">
          <div className="grid grid-cols-1 gap-6">
            {getSettingsBySection('seo').length === 0 ? (
              <p className="text-gray-500 text-center py-8">尚未设置任何SEO设置</p>
            ) : (
              getSettingsBySection('seo').map(setting => (
                <SettingCard 
                  key={setting.id}
                  setting={setting}
                  onChange={(value) => handleSettingChange(setting.id, value)}
                />
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 gap-6">
            {getSettingsBySection('analytics').length === 0 ? (
              <p className="text-gray-500 text-center py-8">尚未设置任何统计设置</p>
            ) : (
              getSettingsBySection('analytics').map(setting => (
                <SettingCard 
                  key={setting.id}
                  setting={setting}
                  onChange={(value) => handleSettingChange(setting.id, value)}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Setting Card Component
interface SettingCardProps {
  setting: SiteSetting;
  onChange: (value: string) => void;
  onDelete?: () => void;
}

const SettingCard = ({ setting, onChange, onDelete }: SettingCardProps) => {
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
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          {setting.key}
          {onDelete && (
            <Button variant="destructive" size="sm" onClick={onDelete}>
              删除
            </Button>
          )}
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

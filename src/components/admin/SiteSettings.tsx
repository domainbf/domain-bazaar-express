
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
          <div className="grid grid-cols-1 gap-6">
            {getSettingsBySection('general').length === 0 ? (
              <p className="text-gray-500 text-center py-8">尚未设置任何常规设置</p>
            ) : (
              getSettingsBySection('general').map(setting => (
                <SettingCard 
                  key={setting.id}
                  setting={setting}
                  onChange={(value) => handleSettingChange(setting.id, value)}
                />
              ))
            )}
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

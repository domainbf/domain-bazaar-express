import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Globe, 
  Mail, 
  Shield, 
  Bell, 
  Palette, 
  Save, 
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface QuickSetting {
  key: string;
  value: string;
  label: string;
  type: 'text' | 'boolean' | 'textarea' | 'number';
  description?: string;
  category: string;
}

export const QuickSettingsPanel = () => {
  const [settings, setSettings] = useState<QuickSetting[]>([
    { key: 'site_name', value: 'NIC.BN', label: '网站名称', type: 'text', category: 'general', description: '显示在标题和页面上的网站名称' },
    { key: 'site_description', value: '专业的域名交易平台', label: '网站描述', type: 'text', category: 'general', description: '用于SEO的网站描述' },
    { key: 'contact_email', value: '', label: '联系邮箱', type: 'text', category: 'general', description: '接收用户反馈的邮箱地址' },
    { key: 'maintenance_mode', value: 'false', label: '维护模式', type: 'boolean', category: 'system', description: '开启后访客将看到维护页面' },
    { key: 'registration_enabled', value: 'true', label: '开放注册', type: 'boolean', category: 'system', description: '允许新用户注册' },
    { key: 'email_notifications', value: 'true', label: '邮件通知', type: 'boolean', category: 'notifications', description: '发送交易和报价邮件通知' },
    { key: 'auto_verify_domains', value: 'false', label: '自动验证域名', type: 'boolean', category: 'domains', description: '新提交的域名自动通过验证' },
    { key: 'min_offer_amount', value: '100', label: '最低报价金额', type: 'number', category: 'domains', description: '用户可以提交的最低报价金额' },
    { key: 'platform_fee_percent', value: '5', label: '平台费率 (%)', type: 'number', category: 'finance', description: '交易成功后平台收取的手续费比例' },
  ]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');

      if (error) throw error;

      if (data && data.length > 0) {
        setSettings(prev => prev.map(setting => {
          const dbSetting = data.find(s => s.key === setting.key);
          return dbSetting ? { ...setting, value: dbSetting.value || setting.value } : setting;
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => prev.map(setting =>
      setting.key === key ? { ...setting, value } : setting
    ));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const setting of settings) {
        await supabase
          .from('site_settings')
          .upsert({
            key: setting.key,
            value: setting.value,
            description: setting.description,
            section: setting.category,
            type: setting.type
          }, { onConflict: 'key' });
      }
      toast.success('设置已保存');
      setHasChanges(false);
    } catch (error: any) {
      toast.error('保存失败: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getSettingsByCategory = (category: string) => {
    return settings.filter(s => s.category === category);
  };

  const renderSetting = (setting: QuickSetting) => {
    switch (setting.type) {
      case 'boolean':
        return (
          <div key={setting.key} className="flex items-center justify-between py-3">
            <div className="flex-1">
              <Label className="text-sm font-medium">{setting.label}</Label>
              {setting.description && (
                <p className="text-xs text-muted-foreground mt-1">{setting.description}</p>
              )}
            </div>
            <Switch
              checked={setting.value === 'true'}
              onCheckedChange={(checked) => handleChange(setting.key, checked ? 'true' : 'false')}
            />
          </div>
        );
      case 'textarea':
        return (
          <div key={setting.key} className="py-3 space-y-2">
            <Label className="text-sm font-medium">{setting.label}</Label>
            {setting.description && (
              <p className="text-xs text-muted-foreground">{setting.description}</p>
            )}
            <Textarea
              value={setting.value}
              onChange={(e) => handleChange(setting.key, e.target.value)}
              rows={3}
            />
          </div>
        );
      case 'number':
        return (
          <div key={setting.key} className="py-3 space-y-2">
            <Label className="text-sm font-medium">{setting.label}</Label>
            {setting.description && (
              <p className="text-xs text-muted-foreground">{setting.description}</p>
            )}
            <Input
              type="number"
              value={setting.value}
              onChange={(e) => handleChange(setting.key, e.target.value)}
              className="max-w-xs"
            />
          </div>
        );
      default:
        return (
          <div key={setting.key} className="py-3 space-y-2">
            <Label className="text-sm font-medium">{setting.label}</Label>
            {setting.description && (
              <p className="text-xs text-muted-foreground">{setting.description}</p>
            )}
            <Input
              value={setting.value}
              onChange={(e) => handleChange(setting.key, e.target.value)}
            />
          </div>
        );
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
            <Settings className="h-5 w-5" />
            快速设置
          </h2>
          <p className="text-sm text-muted-foreground mt-1">管理网站核心配置，所有更改即时生效</p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              <AlertCircle className="h-3 w-3 mr-1" />
              未保存的更改
            </Badge>
          )}
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            保存设置
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 常规设置 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              常规设置
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {getSettingsByCategory('general').map(renderSetting)}
          </CardContent>
        </Card>

        {/* 系统设置 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              系统设置
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {getSettingsByCategory('system').map(renderSetting)}
          </CardContent>
        </Card>

        {/* 域名设置 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              域名管理
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {getSettingsByCategory('domains').map(renderSetting)}
          </CardContent>
        </Card>

        {/* 通知设置 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              通知与财务
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {getSettingsByCategory('notifications').map(renderSetting)}
            {getSettingsByCategory('finance').map(renderSetting)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

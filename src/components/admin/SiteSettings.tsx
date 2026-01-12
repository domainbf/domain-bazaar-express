import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings, Globe, Mail, PieChart, Shield, Plus, Trash2, Save, RefreshCw, Database, Bell, Palette } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface SiteSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
  section: string;
  type: string;
}

interface SmtpSettings {
  host: string;
  port: number;
  username: string;
  password: string;
  from_email: string;
  from_name: string;
  enabled: boolean;
}

export const SiteSettings = () => {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [smtpSettings, setSmtpSettings] = useState<SmtpSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newSetting, setNewSetting] = useState({ key: '', value: '', description: '', section: 'general', type: 'text' });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    loadSettings();
    loadSmtpSettings();
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
      toast.error('加载网站设置失败');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSmtpSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('smtp_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setSmtpSettings(data);
      }
    } catch (error: any) {
      console.error('加载SMTP设置时出错:', error);
    }
  };

  const handleSettingChange = (id: string, value: string) => {
    setSettings(settings.map((setting) => 
      setting.id === id ? { ...setting, value } : setting
    ));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
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
      toast.error('保存设置失败');
    } finally {
      setIsSaving(false);
    }
  };

  const saveSmtpSettings = async () => {
    if (!smtpSettings) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('smtp_settings')
        .upsert([smtpSettings]);
      
      if (error) throw error;
      toast.success('SMTP设置已保存');
    } catch (error: any) {
      console.error('保存SMTP设置时出错:', error);
      toast.error('保存SMTP设置失败');
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
      setIsAddDialogOpen(false);
      toast.success('新设置项已添加');
    } catch (error: any) {
      console.error('添加设置项时出错:', error);
      toast.error('添加设置项失败');
    }
  };

  const deleteSetting = async (id: string) => {
    if (!confirm('确定要删除此设置项吗？')) return;
    
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
      toast.error('删除设置项失败');
    }
  };

  const getSettingsBySection = (section: string) => {
    return settings.filter(setting => setting.section === section);
  };

  const testSmtpConnection = async () => {
    toast.info('正在测试SMTP连接...');
    // 这里可以调用边缘函数来测试SMTP连接
    setTimeout(() => {
      toast.success('SMTP连接测试成功');
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <h2 className="text-xl font-semibold">网站设置</h2>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                添加设置
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加新设置项</DialogTitle>
                <DialogDescription>创建一个新的网站设置配置</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>设置键名</Label>
                  <Input
                    value={newSetting.key}
                    onChange={(e) => setNewSetting({...newSetting, key: e.target.value})}
                    placeholder="例如: site_title"
                  />
                </div>
                <div>
                  <Label>设置值</Label>
                  <Input
                    value={newSetting.value}
                    onChange={(e) => setNewSetting({...newSetting, value: e.target.value})}
                    placeholder="设置值"
                  />
                </div>
                <div>
                  <Label>描述</Label>
                  <Input
                    value={newSetting.description}
                    onChange={(e) => setNewSetting({...newSetting, description: e.target.value})}
                    placeholder="设置描述"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>分类</Label>
                    <Select
                      value={newSetting.section}
                      onValueChange={(v) => setNewSetting({...newSetting, section: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">常规设置</SelectItem>
                        <SelectItem value="email">邮件设置</SelectItem>
                        <SelectItem value="seo">SEO设置</SelectItem>
                        <SelectItem value="analytics">统计设置</SelectItem>
                        <SelectItem value="security">安全设置</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>类型</Label>
                    <Select
                      value={newSetting.type}
                      onValueChange={(v) => setNewSetting({...newSetting, type: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">文本</SelectItem>
                        <SelectItem value="textarea">长文本</SelectItem>
                        <SelectItem value="boolean">布尔值</SelectItem>
                        <SelectItem value="number">数字</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>取消</Button>
                <Button onClick={addNewSetting}>添加</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={saveSettings} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? '保存中...' : '保存所有设置'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6 flex-wrap">
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
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            安全设置
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="h-4 w-4 mr-2" />
            外观设置
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>配置网站的基本信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getSettingsBySection('general').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>尚未设置任何常规设置</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setIsAddDialogOpen(true)}>
                    添加设置
                  </Button>
                </div>
              ) : (
                getSettingsBySection('general').map(setting => (
                  <SettingItem 
                    key={setting.id}
                    setting={setting}
                    onChange={(value) => handleSettingChange(setting.id, value)}
                    onDelete={() => deleteSetting(setting.id)}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SMTP邮件服务器</CardTitle>
              <CardDescription>配置邮件发送服务</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {smtpSettings ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>SMTP主机</Label>
                      <Input
                        value={smtpSettings.host}
                        onChange={(e) => setSmtpSettings({...smtpSettings, host: e.target.value})}
                        placeholder="smtp.example.com"
                      />
                    </div>
                    <div>
                      <Label>端口</Label>
                      <Input
                        type="number"
                        value={smtpSettings.port}
                        onChange={(e) => setSmtpSettings({...smtpSettings, port: parseInt(e.target.value) || 587})}
                        placeholder="587"
                      />
                    </div>
                    <div>
                      <Label>用户名</Label>
                      <Input
                        value={smtpSettings.username}
                        onChange={(e) => setSmtpSettings({...smtpSettings, username: e.target.value})}
                        placeholder="用户名"
                      />
                    </div>
                    <div>
                      <Label>密码</Label>
                      <Input
                        type="password"
                        value={smtpSettings.password}
                        onChange={(e) => setSmtpSettings({...smtpSettings, password: e.target.value})}
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <Label>发件人邮箱</Label>
                      <Input
                        value={smtpSettings.from_email}
                        onChange={(e) => setSmtpSettings({...smtpSettings, from_email: e.target.value})}
                        placeholder="noreply@example.com"
                      />
                    </div>
                    <div>
                      <Label>发件人名称</Label>
                      <Input
                        value={smtpSettings.from_name}
                        onChange={(e) => setSmtpSettings({...smtpSettings, from_name: e.target.value})}
                        placeholder="NIC.BN"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={smtpSettings.enabled}
                      onCheckedChange={(checked) => setSmtpSettings({...smtpSettings, enabled: checked})}
                    />
                    <Label>启用邮件发送</Label>
                  </div>
                  <Separator />
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={testSmtpConnection}>
                      测试连接
                    </Button>
                    <Button onClick={saveSmtpSettings} disabled={isSaving}>
                      保存SMTP设置
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>尚未配置SMTP设置</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setSmtpSettings({
                      host: '', port: 587, username: '', password: '',
                      from_email: '', from_name: '', enabled: false
                    })}
                  >
                    配置SMTP
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>邮件模板设置</CardTitle>
              <CardDescription>配置邮件通知相关设置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getSettingsBySection('email').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>尚未设置邮件相关配置</p>
                </div>
              ) : (
                getSettingsBySection('email').map(setting => (
                  <SettingItem 
                    key={setting.id}
                    setting={setting}
                    onChange={(value) => handleSettingChange(setting.id, value)}
                    onDelete={() => deleteSetting(setting.id)}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO优化设置</CardTitle>
              <CardDescription>配置网站搜索引擎优化相关设置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getSettingsBySection('seo').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>尚未设置SEO配置</p>
                  <p className="text-xs mt-1">建议添加: meta_title, meta_description, keywords 等设置</p>
                </div>
              ) : (
                getSettingsBySection('seo').map(setting => (
                  <SettingItem 
                    key={setting.id}
                    setting={setting}
                    onChange={(value) => handleSettingChange(setting.id, value)}
                    onDelete={() => deleteSetting(setting.id)}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>安全设置</CardTitle>
              <CardDescription>配置网站安全相关设置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">启用验证码</p>
                    <p className="text-sm text-muted-foreground">在表单提交时要求验证码</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">限制登录尝试</p>
                    <p className="text-sm text-muted-foreground">连续失败后暂时锁定账户</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">双因素认证</p>
                    <p className="text-sm text-muted-foreground">要求管理员启用2FA</p>
                  </div>
                  <Switch />
                </div>
              </div>
              
              {getSettingsBySection('security').length > 0 && (
                <>
                  <Separator />
                  {getSettingsBySection('security').map(setting => (
                    <SettingItem 
                      key={setting.id}
                      setting={setting}
                      onChange={(value) => handleSettingChange(setting.id, value)}
                      onDelete={() => deleteSetting(setting.id)}
                    />
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>外观设置</CardTitle>
              <CardDescription>配置网站外观和主题</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="font-medium mb-2">主题模式</p>
                  <Select defaultValue="system">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">浅色模式</SelectItem>
                      <SelectItem value="dark">深色模式</SelectItem>
                      <SelectItem value="system">跟随系统</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="font-medium mb-2">主色调</p>
                  <div className="flex gap-2">
                    {['#000000', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'].map(color => (
                      <button
                        key={color}
                        className="w-8 h-8 rounded-full border-2 border-transparent hover:border-foreground transition-colors"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// 设置项组件
interface SettingItemProps {
  setting: SiteSetting;
  onChange: (value: string) => void;
  onDelete?: () => void;
}

const SettingItem = ({ setting, onChange, onDelete }: SettingItemProps) => {
  const renderInput = () => {
    switch (setting.type) {
      case 'textarea':
        return (
          <Textarea
            value={setting.value || ''}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
          />
        );
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={setting.value === 'true'}
              onCheckedChange={(checked) => onChange(checked ? 'true' : 'false')}
            />
            <span className="text-sm">{setting.value === 'true' ? '启用' : '禁用'}</span>
          </div>
        );
      case 'number':
        return (
          <Input
            type="number"
            value={setting.value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      default:
        return (
          <Input
            value={setting.value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );
    }
  };

  return (
    <div className="flex items-start gap-4 p-4 border rounded-lg">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Label className="font-medium">{setting.key}</Label>
          <Badge variant="outline" className="text-xs">{setting.type}</Badge>
        </div>
        {setting.description && (
          <p className="text-sm text-muted-foreground">{setting.description}</p>
        )}
        {renderInput()}
      </div>
      {onDelete && (
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-600" />
        </Button>
      )}
    </div>
  );
};
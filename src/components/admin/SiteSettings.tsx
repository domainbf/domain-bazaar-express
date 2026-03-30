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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Globe, Mail, Shield, Plus, Trash2, Save, Database, Palette, Key, Eye, EyeOff, Send, CheckCircle, XCircle, Loader2, AlertCircle, Phone, Puzzle, TestTube2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
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

interface SmtpForm {
  host: string;
  port: string;
  username: string;
  password: string;
  from_email: string;
  from_name: string;
}

export const SiteSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newSetting, setNewSetting] = useState({ key: '', value: '', description: '', section: 'general', type: 'text' });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [targetEmail, setTargetEmail] = useState('');
  const [targetPassword, setTargetPassword] = useState('');
  const [isChangingUserPassword, setIsChangingUserPassword] = useState(false);

  // SMTP config state
  const [smtp, setSmtp] = useState<SmtpForm>({
    host: '', port: '465', username: '', password: '', from_email: '', from_name: '域见•你',
  });
  const [smtpSaved, setSmtpSaved] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [testEmailAddr, setTestEmailAddr] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // WHOIS API config state
  const [whoisApiKey, setWhoisApiKey] = useState('');
  const [showWhoisKey, setShowWhoisKey] = useState(false);
  const [isSavingWhois, setIsSavingWhois] = useState(false);
  const [isTestingWhois, setIsTestingWhois] = useState(false);
  const [whoisTestResult, setWhoisTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [whoisTestDomain, setWhoisTestDomain] = useState('google.com');

  // Contact info state
  const [contactInfo, setContactInfo] = useState({
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    emergency_phone: '',
    hours_online: '9:00 - 18:00',
    hours_phone: '9:00 - 18:00',
    hours_weekday: '周一至周五（节假日除外）',
  });
  const [isSavingContact, setIsSavingContact] = useState(false);

  const handleChangeOwnPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error('密码至少8位');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('两次密码不一致');
      return;
    }
    setIsChangingPassword(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('admin-password', {
        body: { action: 'change_own_password', password: newPassword },
      });
      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);
      toast.success('密码修改成功');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || '密码修改失败');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleChangeUserPassword = async () => {
    if (!targetEmail) {
      toast.error('请输入用户邮箱');
      return;
    }
    if (!targetPassword || targetPassword.length < 8) {
      toast.error('密码至少8位');
      return;
    }
    setIsChangingUserPassword(true);
    try {
      const response = await supabase.functions.invoke('admin-password', {
        body: { action: 'change_user_password', email: targetEmail, password: targetPassword },
      });
      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);
      toast.success(`用户 ${targetEmail} 密码已更新`);
      setTargetEmail('');
      setTargetPassword('');
    } catch (error: any) {
      toast.error(error.message || '修改用户密码失败');
    } finally {
      setIsChangingUserPassword(false);
    }
  };

  useEffect(() => {
    loadSettings();
    loadSmtpConfig();
    loadContactConfig();
    loadWhoisConfig();
  }, []);

  const loadWhoisConfig = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['whois_api_key']);
      if (data && data.length > 0) {
        const map = Object.fromEntries(data.map((r: any) => [r.key, r.value]));
        setWhoisApiKey(map['whois_api_key'] || '');
      }
    } catch (e) { console.error('loadWhoisConfig error', e); }
  };

  const saveWhoisConfig = async () => {
    setIsSavingWhois(true);
    try {
      await supabase.from('site_settings').upsert([
        { key: 'whois_api_key', value: whoisApiKey, description: 'WHOIS/RDAP API Key (www.x.rw)', section: 'api', type: 'text' },
      ], { onConflict: 'key' });
      toast.success('WHOIS API 配置已保存');
    } catch (e: any) {
      toast.error('保存失败：' + (e.message || '未知错误'));
    } finally {
      setIsSavingWhois(false);
    }
  };

  const testWhoisApi = async () => {
    if (!whoisTestDomain.trim()) {
      toast.error('请输入要查询的域名');
      return;
    }
    setIsTestingWhois(true);
    setWhoisTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('whois-query', {
        body: { domain: whoisTestDomain.trim() },
      });
      if (error || !data?.success) {
        setWhoisTestResult({ ok: false, msg: data?.error || error?.message || '查询失败' });
      } else {
        const d = data.data;
        setWhoisTestResult({ ok: true, msg: `查询成功！注册商: ${d.registrar || '未知'} | 注册日期: ${d.createdDate || '未知'} | RDAP: ${d.rdap ? '是' : '否'}` });
      }
    } catch (e: any) {
      setWhoisTestResult({ ok: false, msg: e.message || '查询异常' });
    } finally {
      setIsTestingWhois(false);
    }
  };

  const loadSmtpConfig = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'smtp_from_email', 'smtp_from_name']);
      if (data && data.length > 0) {
        const map = Object.fromEntries(data.map((r: any) => [r.key, r.value]));
        setSmtp({
          host: map['smtp_host'] || '',
          port: map['smtp_port'] || '465',
          username: map['smtp_username'] || '',
          password: map['smtp_password'] || '',
          from_email: map['smtp_from_email'] || '',
          from_name: map['smtp_from_name'] || '域见•你',
        });
        if (map['smtp_host'] && map['smtp_username']) setSmtpSaved(true);
      }
    } catch (e) { console.error('loadSmtpConfig error', e); }
  };

  const loadContactConfig = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['contact_email', 'contact_phone', 'contact_address', 'emergency_phone', 'hours_online', 'hours_phone', 'hours_weekday']);
      if (data && data.length > 0) {
        const map = Object.fromEntries(data.map((r: any) => [r.key, r.value]));
        setContactInfo({
          contact_email: map['contact_email'] || '',
          contact_phone: map['contact_phone'] || '',
          contact_address: map['contact_address'] || '',
          emergency_phone: map['emergency_phone'] || '',
          hours_online: map['hours_online'] || '9:00 - 18:00',
          hours_phone: map['hours_phone'] || '9:00 - 18:00',
          hours_weekday: map['hours_weekday'] || '周一至周五（节假日除外）',
        });
      }
    } catch (e) { console.error('loadContactConfig error', e); }
  };

  const saveContactConfig = async () => {
    setIsSavingContact(true);
    try {
      const rows = [
        { key: 'contact_email', value: contactInfo.contact_email, description: '客服邮箱', section: 'contact', type: 'text' },
        { key: 'contact_phone', value: contactInfo.contact_phone, description: '客服电话', section: 'contact', type: 'text' },
        { key: 'contact_address', value: contactInfo.contact_address, description: '公司地址', section: 'contact', type: 'textarea' },
        { key: 'emergency_phone', value: contactInfo.emergency_phone, description: '紧急热线', section: 'contact', type: 'text' },
        { key: 'hours_online', value: contactInfo.hours_online, description: '在线客服时间', section: 'contact', type: 'text' },
        { key: 'hours_phone', value: contactInfo.hours_phone, description: '电话支持时间', section: 'contact', type: 'text' },
        { key: 'hours_weekday', value: contactInfo.hours_weekday, description: '服务工作日', section: 'contact', type: 'text' },
      ];
      for (const row of rows) {
        await supabase.from('site_settings').upsert([row], { onConflict: 'key' });
      }
      toast.success('联系方式设置已保存');
    } catch (e: any) {
      toast.error('保存失败：' + e.message);
    } finally {
      setIsSavingContact(false);
    }
  };

  const saveEmailConfig = async () => {
    if (!smtp.host || !smtp.username || !smtp.password || !smtp.from_email) {
      toast.error('请填写 SMTP 主机、用户名、密码和发件邮箱');
      return;
    }
    setIsSavingEmail(true);
    try {
      const rows = [
        { key: 'smtp_host', value: smtp.host, description: 'SMTP 主机', section: 'email', type: 'text' },
        { key: 'smtp_port', value: smtp.port, description: 'SMTP 端口', section: 'email', type: 'text' },
        { key: 'smtp_username', value: smtp.username, description: 'SMTP 用户名', section: 'email', type: 'text' },
        { key: 'smtp_password', value: smtp.password, description: 'SMTP 密码', section: 'email', type: 'text' },
        { key: 'smtp_from_email', value: smtp.from_email, description: '发件邮箱', section: 'email', type: 'text' },
        { key: 'smtp_from_name', value: smtp.from_name, description: '发件人名称', section: 'email', type: 'text' },
      ];
      for (const row of rows) {
        await supabase.from('site_settings').upsert([row], { onConflict: 'key' });
      }
      setSmtpSaved(true);
      toast.success('SMTP 设置已保存');
    } catch (e: any) {
      toast.error('保存失败：' + e.message);
    } finally {
      setIsSavingEmail(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmailAddr) { toast.error('请输入测试收件邮箱'); return; }
    setIsSendingTest(true);
    setEmailTestResult(null);
    try {
      const fromAddr = smtp.from_name && smtp.from_email
        ? `${smtp.from_name} <${smtp.from_email}>`
        : smtp.from_email || undefined;
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: testEmailAddr,
          ...(fromAddr ? { from: fromAddr } : {}),
          subject: '【域见•你】SMTP 邮件系统测试',
          html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:sans-serif;background:#f1f5f9;padding:32px 16px;"><div style="max-width:560px;margin:0 auto;"><div style="background:#0f172a;border-radius:12px;padding:10px 20px;display:inline-block;margin-bottom:24px;"><span style="color:#f8fafc;font-size:18px;font-weight:800;">域见•你</span><span style="color:#64748b;font-size:12px;margin-left:8px;">NIC.RW</span></div><div style="background:#fff;border-radius:16px;padding:40px;box-shadow:0 4px 6px rgba(0,0,0,0.07);"><div style="text-align:center;margin-bottom:24px;"><span style="font-size:48px;">✅</span><h2 style="margin:16px 0 8px;color:#0f172a;">SMTP 邮件系统正常</h2><p style="color:#64748b;margin:0;">SMTP 配置验证成功</p></div><div style="background:#f8fafc;border-radius:8px;padding:16px;font-size:13px;color:#475569;"><p style="margin:0 0 6px;"><strong>SMTP 主机：</strong>${smtp.host}:${smtp.port}</p><p style="margin:0 0 6px;"><strong>发件人：</strong>${smtp.from_name} &lt;${smtp.from_email}&gt;</p><p style="margin:0 0 6px;"><strong>收件人：</strong>${testEmailAddr}</p><p style="margin:0;"><strong>发送时间：</strong>${new Date().toLocaleString('zh-CN')}</p></div></div><p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:20px;">© ${new Date().getFullYear()} 域见•你 · NIC.RW</p></div></body></html>`,
        },
      });
      if (error || data?.success === false) throw new Error(error?.message || data?.error || '发送失败');
      setEmailTestResult({ ok: true, msg: `测试邮件已发送至 ${testEmailAddr}，请检查收件箱` });
      toast.success(`测试邮件已发送至 ${testEmailAddr}`);
    } catch (e: any) {
      const msg = e.message || '未知错误';
      setEmailTestResult({ ok: false, msg });
      toast.error('发送失败：' + msg);
    } finally {
      setIsSendingTest(false);
    }
  };

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
          <TabsTrigger value="contact">
            <Phone className="h-4 w-4 mr-2" />
            联系方式
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
          <TabsTrigger value="api">
            <Puzzle className="h-4 w-4 mr-2" />
            API 集成
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

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                联系方式设置
              </CardTitle>
              <CardDescription>
                配置显示在联系我们页面和安全中心的联系信息，留空则不显示
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">客服邮箱</Label>
                  <Input
                    placeholder="例：support@nic.rw"
                    value={contactInfo.contact_email}
                    onChange={(e) => setContactInfo({ ...contactInfo, contact_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">客服电话</Label>
                  <Input
                    placeholder="例：+673-xxx-xxxx"
                    value={contactInfo.contact_phone}
                    onChange={(e) => setContactInfo({ ...contactInfo, contact_phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">公司地址</Label>
                <Textarea
                  placeholder="例：文莱达鲁萨兰国&#10;信息通信技术发展局"
                  rows={3}
                  value={contactInfo.contact_address}
                  onChange={(e) => setContactInfo({ ...contactInfo, contact_address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-semibold flex items-center gap-2">
                  <span className="text-red-600">紧急热线</span>
                  <Badge variant="destructive" className="text-xs">谨慎填写</Badge>
                </Label>
                <Input
                  placeholder="例：+673-999-xxxx（留空则不显示紧急热线区块）"
                  value={contactInfo.emergency_phone}
                  onChange={(e) => setContactInfo({ ...contactInfo, emergency_phone: e.target.value })}
                />
              </div>

              <Separator />

              <div>
                <p className="font-semibold mb-3">服务时间</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>在线客服时间</Label>
                    <Input
                      placeholder="9:00 - 18:00"
                      value={contactInfo.hours_online}
                      onChange={(e) => setContactInfo({ ...contactInfo, hours_online: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>电话支持时间</Label>
                    <Input
                      placeholder="9:00 - 18:00"
                      value={contactInfo.hours_phone}
                      onChange={(e) => setContactInfo({ ...contactInfo, hours_phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>服务工作日说明</Label>
                    <Input
                      placeholder="周一至周五（节假日除外）"
                      value={contactInfo.hours_weekday}
                      onChange={(e) => setContactInfo({ ...contactInfo, hours_weekday: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={saveContactConfig} disabled={isSavingContact}>
                  {isSavingContact ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />保存中...</> : <><Save className="h-4 w-4 mr-2" />保存联系方式</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="email" className="space-y-6">
          {/* SMTP Config Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    SMTP 邮件服务
                  </CardTitle>
                  <CardDescription className="mt-1">
                    支持任意 SMTP 服务商：Gmail、QQ 邮箱、阿里云、Outlook、自建邮件服务等
                  </CardDescription>
                </div>
                {smtpSaved && (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" /> 已配置
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Common provider hints */}
              <div className="rounded-lg bg-muted/50 border px-4 py-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground mb-1">常用服务商参数参考</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5">
                  <span>Gmail: smtp.gmail.com · 465 (SSL)</span>
                  <span>QQ 邮箱: smtp.qq.com · 465 (SSL)</span>
                  <span>163 邮箱: smtp.163.com · 465 (SSL)</span>
                  <span>Outlook: smtp.office365.com · 587 (TLS)</span>
                  <span>阿里云 DirectMail: smtpdm.aliyun.com · 465</span>
                  <span>自建 Postfix: 你的域名 · 587 (TLS)</span>
                </div>
              </div>

              {/* Host + Port */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-2">
                  <Label className="font-semibold">SMTP 主机 <span className="text-destructive">*</span></Label>
                  <Input
                    value={smtp.host}
                    onChange={(e) => setSmtp(s => ({ ...s, host: e.target.value }))}
                    placeholder="smtp.example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">端口</Label>
                  <Select value={smtp.port} onValueChange={(v) => setSmtp(s => ({ ...s, port: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="465">465 (SSL)</SelectItem>
                      <SelectItem value="587">587 (TLS)</SelectItem>
                      <SelectItem value="25">25 (明文)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Username + Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">用户名（邮箱账号）<span className="text-destructive"> *</span></Label>
                  <Input
                    value={smtp.username}
                    onChange={(e) => setSmtp(s => ({ ...s, username: e.target.value }))}
                    placeholder="user@example.com"
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">密码 / 授权码 <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      type={showSmtpPass ? 'text' : 'password'}
                      value={smtp.password}
                      onChange={(e) => setSmtp(s => ({ ...s, password: e.target.value }))}
                      placeholder="SMTP 密码或授权码"
                      className="pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showSmtpPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">QQ/163 邮箱请使用授权码而非登录密码</p>
                </div>
              </div>

              {/* From info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">发件邮箱 <span className="text-destructive">*</span></Label>
                  <Input
                    value={smtp.from_email}
                    onChange={(e) => setSmtp(s => ({ ...s, from_email: e.target.value }))}
                    placeholder="noreply@example.com"
                  />
                  <p className="text-xs text-muted-foreground">通常与用户名相同</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">发件人名称</Label>
                  <Input
                    value={smtp.from_name}
                    onChange={(e) => setSmtp(s => ({ ...s, from_name: e.target.value }))}
                    placeholder="域见•你"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button onClick={saveEmailConfig} disabled={isSavingEmail} className="gap-2">
                  {isSavingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isSavingEmail ? '保存中...' : '保存 SMTP 配置'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test Email Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                发送测试邮件
              </CardTitle>
              <CardDescription>保存配置后，发一封测试邮件验证 SMTP 是否连通</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {emailTestResult && (
                emailTestResult.ok ? (
                  <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-300 font-medium">{emailTestResult.msg}</AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{emailTestResult.msg}</AlertDescription>
                  </Alert>
                )
              )}

              <div className="flex gap-3">
                <Input
                  type="email"
                  value={testEmailAddr}
                  onChange={(e) => setTestEmailAddr(e.target.value)}
                  placeholder="收件邮箱地址"
                  className="flex-1"
                />
                <Button
                  onClick={sendTestEmail}
                  disabled={isSendingTest || !testEmailAddr}
                  variant="outline"
                  className="gap-2 shrink-0"
                >
                  {isSendingTest ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />发送中...</>
                  ) : (
                    <><Send className="h-4 w-4" />发送测试</>
                  )}
                </Button>
              </div>

              {!smtpSaved && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  请先填写 SMTP 配置并保存后再发送测试邮件
                </p>
              )}
            </CardContent>
          </Card>

          {/* Password reset notice */}
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
            <AlertDescription className="text-amber-800 dark:text-amber-400">
              <strong>关于找回密码邮件：</strong>密码重置邮件由 Supabase Auth Hook 触发。
              如需密码重置走本站 SMTP，请在 Supabase 控制台将 auth-email-webhook 函数重新部署（使用最新代码）。
              平台内的交易通知邮件均通过上方 SMTP 配置直接发送。
            </AlertDescription>
          </Alert>
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
          {/* Admin Password Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                管理员密码管理
              </CardTitle>
              <CardDescription>修改管理员密码或重置用户密码</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Change own password */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">修改自己的密码</h4>
                <p className="text-sm text-muted-foreground">当前账号: {user?.email}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Label>新密码</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="输入新密码（至少8位）"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label>确认密码</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="再次输入新密码"
                    />
                  </div>
                </div>
                <Button onClick={handleChangeOwnPassword} disabled={isChangingPassword}>
                  {isChangingPassword ? '修改中...' : '修改密码'}
                </Button>
              </div>

              {/* Change user password */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">修改用户密码</h4>
                <p className="text-sm text-muted-foreground">管理员可重置任意用户的登录密码</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>用户邮箱</Label>
                    <Input
                      type="email"
                      value={targetEmail}
                      onChange={(e) => setTargetEmail(e.target.value)}
                      placeholder="输入用户邮箱"
                    />
                  </div>
                  <div>
                    <Label>新密码</Label>
                    <Input
                      type="password"
                      value={targetPassword}
                      onChange={(e) => setTargetPassword(e.target.value)}
                      placeholder="输入新密码（至少8位）"
                    />
                  </div>
                </div>
                <Button onClick={handleChangeUserPassword} disabled={isChangingUserPassword} variant="outline">
                  {isChangingUserPassword ? '修改中...' : '重置用户密码'}
                </Button>
              </div>
            </CardContent>
          </Card>

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

        {/* API 集成 Tab */}
        <TabsContent value="api" className="space-y-6">
          {/* WHOIS / RDAP API */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                WHOIS / RDAP API（www.x.rw）
                {whoisApiKey && (
                  <Badge className="bg-green-500/10 text-green-600 border-green-200 ml-auto">已配置</Badge>
                )}
              </CardTitle>
              <CardDescription>
                配置 RDAP+WHOIS API 密钥，用于域名详情页的 WHOIS 信息查询。API 文档：
                <a href="https://www.x.rw/docs" target="_blank" rel="noopener noreferrer"
                  className="text-primary underline ml-1">www.x.rw/docs</a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>如何获取 API Key：</strong>访问
                  <a href="https://www.x.rw" target="_blank" rel="noopener noreferrer" className="text-primary underline mx-1">www.x.rw</a>
                  注册账号，在控制台生成 API Key（格式：<code className="bg-muted px-1 rounded text-xs">rwh_xxxxxxxx</code>）。
                  未配置时将使用免费公共接口（查询限制较多）。
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label className="font-semibold">API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showWhoisKey ? 'text' : 'password'}
                      placeholder="rwh_your_api_key_here"
                      value={whoisApiKey}
                      onChange={(e) => setWhoisApiKey(e.target.value)}
                      className="pr-10 font-mono"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowWhoisKey(v => !v)}
                    >
                      {showWhoisKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button onClick={saveWhoisConfig} disabled={isSavingWhois}>
                    {isSavingWhois ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
                    保存
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  API Key 将加密存储在数据库中，WHOIS 查询将通过后端 Edge Function 进行，前端不会直接暴露 Key。
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="font-semibold">测试 WHOIS 查询</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="输入域名，例如：google.com"
                    value={whoisTestDomain}
                    onChange={(e) => setWhoisTestDomain(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && testWhoisApi()}
                  />
                  <Button variant="outline" onClick={testWhoisApi} disabled={isTestingWhois}>
                    {isTestingWhois
                      ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      : <TestTube2 className="h-4 w-4 mr-1.5" />}
                    测试
                  </Button>
                </div>

                {whoisTestResult && (
                  <Alert className={whoisTestResult.ok ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                    {whoisTestResult.ok
                      ? <CheckCircle className="h-4 w-4 text-green-600" />
                      : <XCircle className="h-4 w-4 text-red-600" />}
                    <AlertDescription className={whoisTestResult.ok ? 'text-green-700' : 'text-red-700'}>
                      {whoisTestResult.msg}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Separator />

              <div className="p-4 bg-muted/40 rounded-xl space-y-2 text-sm">
                <p className="font-semibold text-foreground">API 端点说明</p>
                <div className="space-y-1 text-muted-foreground font-mono text-xs">
                  <p>有 Key：<code>https://www.x.rw/api/lookup?query=example.com</code>（Header: X-API-Key）</p>
                  <p>无 Key：<code>https://xrw-tau.vercel.app/api/lookup?query=example.com</code>（免费限流）</p>
                </div>
                <p className="text-xs text-muted-foreground">支持数据：WHOIS、RDAP、注册商、创建/到期日期、DNS 服务器、DNSSEC、EPP 状态</p>
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
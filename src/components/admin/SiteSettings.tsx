import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete, apiFetch } from '@/lib/apiClient';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Globe, Mail, Shield, Plus, Trash2, Save, Database, Palette, Key, Eye, EyeOff, Send, CheckCircle, XCircle, Loader2, AlertCircle, Phone, Puzzle, TestTube2, Zap, Info, Power, UserX, Wrench, Sparkles, Smartphone, MessageSquare } from 'lucide-react';
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

const SMTP_PRESETS: Array<{
  label: string;
  hint: string;
  host: string;
  port: string;
  note?: string;
}> = [
  { label: 'QQ 邮箱',        hint: 'qq.com',          host: 'smtp.qq.com',           port: '465', note: '密码处填授权码，非QQ密码' },
  { label: '163 / 网易',     hint: '163.com',          host: 'smtp.163.com',          port: '465', note: '密码处填授权码' },
  { label: '126 邮箱',       hint: '126.com',          host: 'smtp.126.com',          port: '465', note: '密码处填授权码' },
  { label: '腾讯企业邮',     hint: 'exmail.qq.com',    host: 'smtp.exmail.qq.com',    port: '465' },
  { label: '阿里云邮件推送', hint: 'smtpdm.aliyun.com',host: 'smtpdm.aliyun.com',    port: '465', note: '用户名为发信地址' },
  { label: 'Gmail',           hint: 'gmail.com',        host: 'smtp.gmail.com',        port: '465', note: '需开启两步验证并生成应用密码' },
  { label: 'Outlook / 365',  hint: 'office365.com',    host: 'smtp.office365.com',    port: '587', note: '587 端口使用 STARTTLS' },
  { label: 'Resend',          hint: 'smtp.resend.com',  host: 'smtp.resend.com',       port: '465', note: '用户名固定为 resend，密码为 API Key' },
];

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
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
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

  // ModelScope AI config state
  const [msApiKey, setMsApiKey] = useState('');
  const [showMsKey, setShowMsKey] = useState(false);
  const [msModel, setMsModel] = useState('black-forest-labs/FLUX.1-schnell');
  const [msAutoGenerate, setMsAutoGenerate] = useState(false);
  const [isSavingMs, setIsSavingMs] = useState(false);
  const [msTestResult, setMsTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isTestingMs, setIsTestingMs] = useState(false);
  const [isBatchingHot, setIsBatchingHot] = useState(false);
  const [isBatchingAuction, setIsBatchingAuction] = useState(false);
  const [batchProgress, setBatchProgress] = useState('');

  // Site control state
  const [siteClosed, setSiteClosed] = useState(false);
  const [registrationClosed, setRegistrationClosed] = useState(false);
  const [pwaInstallBanner, setPwaInstallBanner] = useState(true);
  const [feedbackButtonVisible, setFeedbackButtonVisible] = useState(true);
  const [maintenanceTitle, setMaintenanceTitle] = useState('系统维护中');
  const [maintenanceMessage, setMaintenanceMessage] = useState('我们正在对平台进行升级维护，即将回来，感谢您的耐心等待。');
  const [isSavingControl, setIsSavingControl] = useState(false);

  // Contact info state
  const [contactInfo, setContactInfo] = useState({
    site_domain: '',
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    emergency_phone: '',
    hours_online: '9:00 - 18:00',
    hours_phone: '9:00 - 18:00',
    hours_weekday: '周一至周五（节假日除外）',
  });
  const [isSavingContact, setIsSavingContact] = useState(false);

  // Brand / identity state
  const [brandInfo, setBrandInfo] = useState({
    site_name: '',
    site_subtitle: '',
    logo_url: '',
    logo_dark_url: '',
    favicon_url: '',
    footer_text: '',
    icp_number: '',
    social_github: '',
    social_twitter: '',
    social_wechat: '',
    social_weibo: '',
    social_facebook: '',
  });
  const [isSavingBrand, setIsSavingBrand] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState<'light' | 'dark' | 'favicon' | null>(null);

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
      await apiPost('/data/admin/change-password', { new_password: newPassword });
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
      await apiPost('/data/admin/change-password', { target_email: targetEmail, new_password: targetPassword });
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
    loadAllConfigs();
  }, []);

  const loadAllConfigs = async () => {
    try {
      const data = await apiGet<Record<string, string>>('/data/site-settings');
      if (!data || typeof data !== 'object') return;
      setWhoisApiKey(data['whois_api_key'] || '');
      setMsApiKey(data['modelscope_api_key'] || '');
      setMsModel(data['modelscope_model'] || 'black-forest-labs/FLUX.1-schnell');
      setMsAutoGenerate(data['modelscope_auto_generate'] === 'true');
      const loadedHost = data['smtp_host'] || '';
      setSmtp({
        host: loadedHost,
        port: data['smtp_port'] || '465',
        username: data['smtp_username'] || '',
        password: data['smtp_password'] || '',
        from_email: data['smtp_from_email'] || '',
        from_name: data['smtp_from_name'] || '域见•你',
      });
      if (loadedHost && data['smtp_username']) {
        setSmtpSaved(true);
        const matched = SMTP_PRESETS.find(p => p.host === loadedHost);
        if (matched) setSelectedPreset(matched.label);
      }
      setContactInfo({
        site_domain: data['site_domain'] || '',
        contact_email: data['contact_email'] || '',
        contact_phone: data['contact_phone'] || '',
        contact_address: data['contact_address'] || '',
        emergency_phone: data['emergency_phone'] || '',
        hours_online: data['hours_online'] || '9:00 - 18:00',
        hours_phone: data['hours_phone'] || '9:00 - 18:00',
        hours_weekday: data['hours_weekday'] || '周一至周五（节假日除外）',
      });
      setBrandInfo({
        site_name: data['site_name'] || '',
        site_subtitle: data['site_subtitle'] || '',
        logo_url: data['logo_url'] || '',
        logo_dark_url: data['logo_dark_url'] || '',
        favicon_url: data['favicon_url'] || '',
        footer_text: data['footer_text'] || '',
        icp_number: data['icp_number'] || '',
        social_github: data['social_github'] || '',
        social_twitter: data['social_twitter'] || '',
        social_wechat: data['social_wechat'] || '',
        social_weibo: data['social_weibo'] || '',
        social_facebook: data['social_facebook'] || '',
      });
      setSiteClosed(data['site_closed'] === 'true');
      setRegistrationClosed(data['registration_closed'] === 'true');
      setPwaInstallBanner(data['pwa_install_banner'] !== 'false');
      setFeedbackButtonVisible(data['feedback_button_visible'] !== 'false');
      setMaintenanceTitle(data['maintenance_title'] || '系统维护中');
      setMaintenanceMessage(data['maintenance_message'] || '我们正在对平台进行升级维护，即将回来，感谢您的耐心等待。');
    } catch (e) { console.error('loadAllConfigs error', e); }
  };

  const saveSiteControl = async () => {
    setIsSavingControl(true);
    try {
      await apiPatch('/data/site-settings', {
        site_closed: String(siteClosed),
        registration_closed: String(registrationClosed),
        pwa_install_banner: String(pwaInstallBanner),
        feedback_button_visible: String(feedbackButtonVisible),
        maintenance_title: maintenanceTitle,
        maintenance_message: maintenanceMessage,
      });
      toast.success('站点控制已保存');
    } catch (e: any) {
      toast.error('保存失败：' + (e.message || '未知错误'));
    } finally {
      setIsSavingControl(false);
    }
  };

  const loadWhoisConfig = async () => {
    try {
      const data = await apiGet<Record<string, string>>('/data/site-settings');
      if (data && typeof data === 'object') {
        setWhoisApiKey(data['whois_api_key'] || '');
      }
    } catch (e) { console.error('loadWhoisConfig error', e); }
  };

  const saveWhoisConfig = async () => {
    setIsSavingWhois(true);
    try {
      await apiPatch('/data/site-settings', { whois_api_key: whoisApiKey });
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
      const data = await apiPost('/data/admin/whois-test', { domain: whoisTestDomain.trim() });
      if (!data?.success) {
        setWhoisTestResult({ ok: false, msg: data?.error || '查询失败' });
      } else {
        const d = data.data || {};
        setWhoisTestResult({ ok: true, msg: `查询成功！注册商: ${d.registrar || '未知'} | 注册日期: ${d.createdDate || '未知'}` });
      }
    } catch (e: any) {
      setWhoisTestResult({ ok: false, msg: e.message || '查询异常' });
    } finally {
      setIsTestingWhois(false);
    }
  };


  const saveModelScopeConfig = async () => {
    setIsSavingMs(true);
    try {
      await apiPatch('/data/site-settings', {
        modelscope_api_key: msApiKey,
        modelscope_model: msModel,
        modelscope_auto_generate: String(msAutoGenerate),
      });
      toast.success('ModelScope 配置已保存');
    } catch (e: any) {
      toast.error('保存失败：' + (e.message || '未知错误'));
    } finally {
      setIsSavingMs(false);
    }
  };

  const testModelScopeApi = async () => {
    if (!msApiKey.trim()) { toast.error('请先填写 API Key'); return; }
    setIsTestingMs(true);
    setMsTestResult(null);
    try {
      const { generateDomainLogo } = await import('@/hooks/useModelScopeAI');
      const url = await generateDomainLogo('TEST.BN', { apiKey: msApiKey, model: msModel });
      setMsTestResult({ ok: true, msg: `生成成功！图片URL：${url.slice(0, 60)}...` });
    } catch (e: any) {
      setMsTestResult({ ok: false, msg: e.message || '测试失败，请检查API Key和模型' });
    } finally {
      setIsTestingMs(false);
    }
  };

  const batchGenerateHotLogos = async () => {
    setIsBatchingHot(true);
    setBatchProgress('');
    try {
      const { batchGenerateLogos } = await import('@/hooks/useModelScopeAI');
      const homeData = await apiGet<{ hotDomains: Array<{ id: string; name: string }> }>('/data/home');
      const domains = (homeData?.hotDomains ?? []).map(d => ({ id: String(d.id), name: d.name }));
      if (domains.length === 0) { setBatchProgress('没有找到推荐域名'); return; }
      const result = await batchGenerateLogos(domains, (msg, total, done) => {
        setBatchProgress(`[${done}/${total}] ${msg}`);
      });
      setBatchProgress(`批量完成：成功 ${result.success} 个，失败 ${result.failed} 个`);
      toast.success(`推荐域名 Logo 批量生成完毕（成功 ${result.success} / ${domains.length}）`);
    } catch (e: any) {
      setBatchProgress('批量生成出错：' + (e.message || '未知错误'));
      toast.error('批量生成失败');
    } finally {
      setIsBatchingHot(false);
    }
  };

  const batchGenerateAuctionLogos = async () => {
    setIsBatchingAuction(true);
    setBatchProgress('');
    try {
      const { batchGenerateLogos } = await import('@/hooks/useModelScopeAI');
      const auctionData = await apiGet<Array<{ id: string; name: string }>>('/data/auctions');
      const domains = (auctionData ?? []).map(d => ({ id: String(d.id), name: d.name, type: 'auction' as const }));
      if (domains.length === 0) { setBatchProgress('没有找到拍卖域名'); return; }
      const result = await batchGenerateLogos(domains, (msg, total, done) => {
        setBatchProgress(`[${done}/${total}] ${msg}`);
      });
      setBatchProgress(`批量完成：成功 ${result.success} 个，失败 ${result.failed} 个`);
      toast.success(`拍卖域名 Logo 批量生成完毕（成功 ${result.success} / ${domains.length}）`);
    } catch (e: any) {
      setBatchProgress('批量生成出错：' + (e.message || '未知错误'));
      toast.error('批量生成失败');
    } finally {
      setIsBatchingAuction(false);
    }
  };


  const saveContactConfig = async () => {
    setIsSavingContact(true);
    try {
      const rows = [
        { key: 'site_domain', value: contactInfo.site_domain, description: '网站域名', section: 'contact', type: 'text' },
        { key: 'contact_email', value: contactInfo.contact_email, description: '客服邮箱', section: 'contact', type: 'text' },
        { key: 'contact_phone', value: contactInfo.contact_phone, description: '客服电话', section: 'contact', type: 'text' },
        { key: 'contact_address', value: contactInfo.contact_address, description: '公司地址', section: 'contact', type: 'textarea' },
        { key: 'emergency_phone', value: contactInfo.emergency_phone, description: '紧急热线', section: 'contact', type: 'text' },
        { key: 'hours_online', value: contactInfo.hours_online, description: '在线客服时间', section: 'contact', type: 'text' },
        { key: 'hours_phone', value: contactInfo.hours_phone, description: '电话支持时间', section: 'contact', type: 'text' },
        { key: 'hours_weekday', value: contactInfo.hours_weekday, description: '服务工作日', section: 'contact', type: 'text' },
      ];
      const updates: Record<string, string> = {};
      for (const row of rows) { updates[row.key] = row.value; }
      await apiPatch('/data/site-settings', updates);
      toast.success('联系方式设置已保存');
    } catch (e: any) {
      toast.error('保存失败：' + e.message);
    } finally {
      setIsSavingContact(false);
    }
  };


  const saveBrandConfig = async () => {
    setIsSavingBrand(true);
    try {
      const updates: Record<string, string> = {};
      for (const [k, v] of Object.entries(brandInfo)) {
        updates[k] = v;
      }
      await apiPatch('/data/site-settings', updates);
      toast.success('品牌设置已保存');
    } catch (e: any) {
      toast.error('保存失败：' + (e.message || '未知错误'));
    } finally {
      setIsSavingBrand(false);
    }
  };

  const compressImageToDataUrl = (file: File, maxW = 600, quality = 0.85): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = e => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const scale = Math.min(1, maxW / img.width);
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, w, h);
          const isPng = file.type === 'image/png' || file.type === 'image/svg+xml';
          resolve(canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', isPng ? undefined : quality));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });

  const uploadLogo = async (file: File, mode: 'light' | 'dark' | 'favicon') => {
    setIsUploadingLogo(mode);
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('图片文件不能超过 5MB');
      const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif', 'image/x-icon', 'image/vnd.microsoft.icon'];
      if (!ALLOWED.includes(file.type)) throw new Error('仅支持 JPG/PNG/WebP/SVG/ICO 格式');
      const maxW = mode === 'favicon' ? 256 : 600;
      const dataUrl = await compressImageToDataUrl(file, maxW);
      const res = await apiFetch('/data/admin/upload-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl, mode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '上传失败');
      const key = mode === 'dark' ? 'logo_dark_url' : mode === 'favicon' ? 'favicon_url' : 'logo_url';
      setBrandInfo(prev => ({ ...prev, [key]: json.url }));
      const label = mode === 'dark' ? '深色 Logo' : mode === 'favicon' ? 'Favicon 图标' : '浅色 Logo';
      toast.success(`${label}上传成功`);
    } catch (e: any) {
      toast.error('上传失败：' + (e.message || '未知错误'));
    } finally {
      setIsUploadingLogo(null);
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
      const smtpUpdates: Record<string, string> = {};
      for (const row of rows) { smtpUpdates[row.key] = row.value; }
      await apiPatch('/data/site-settings', smtpUpdates);
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
      const data = await apiPost('/data/admin/send-test-email', { to: testEmailAddr, smtp });
      if (data?.success === false) throw new Error(data?.error ? `[${data.provider || '未知'}] ${data.error}` : '发送失败');
      const providerStr = data?.provider ? `（通过 ${data.provider}）` : '';
      setEmailTestResult({ ok: true, msg: `测试邮件已发送至 ${testEmailAddr}${providerStr}，请检查收件箱` });
      toast.success(`发送成功${providerStr}`);
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
      const data = await apiGet('/data/admin/site-settings');
      setSettings(Array.isArray(data) ? data : []);
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
    if (settings.length === 0) {
      toast.info('暂无设置可保存');
      return;
    }
    setIsSaving(true);
    try {
      const updates: Record<string, string> = {};
      for (const setting of settings) {
        updates[setting.key] = setting.value;
      }
      await apiPatch('/data/site-settings', updates);
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
      const data = await apiPost('/data/admin/site-settings', newSetting);
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
    const setting = settings.find(s => s.id === id);
    if (!setting) return;
    try {
      await apiDelete(`/data/admin/site-settings/${encodeURIComponent(setting.key)}`);
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
        <div className="overflow-x-auto -mx-1 px-1 mb-6">
          <TabsList className="inline-flex min-w-max gap-0 h-auto flex-wrap sm:flex-nowrap">
            <TabsTrigger value="general" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
              <Settings className="h-3.5 w-3.5 mr-1 sm:mr-2 shrink-0" />
              常规设置
            </TabsTrigger>
            <TabsTrigger value="contact" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
              <Phone className="h-3.5 w-3.5 mr-1 sm:mr-2 shrink-0" />
              联系方式
            </TabsTrigger>
            <TabsTrigger value="email" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
              <Mail className="h-3.5 w-3.5 mr-1 sm:mr-2 shrink-0" />
              邮件设置
            </TabsTrigger>
            <TabsTrigger value="seo" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
              <Globe className="h-3.5 w-3.5 mr-1 sm:mr-2 shrink-0" />
              SEO设置
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
              <Shield className="h-3.5 w-3.5 mr-1 sm:mr-2 shrink-0" />
              安全设置
            </TabsTrigger>
            <TabsTrigger value="appearance" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
              <Palette className="h-3.5 w-3.5 mr-1 sm:mr-2 shrink-0" />
              外观
            </TabsTrigger>
            <TabsTrigger value="brand" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
              <Palette className="h-3.5 w-3.5 mr-1 sm:mr-2 shrink-0" />
              品牌
            </TabsTrigger>
            <TabsTrigger value="api" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
              <Puzzle className="h-3.5 w-3.5 mr-1 sm:mr-2 shrink-0" />
              API集成
            </TabsTrigger>
            <TabsTrigger value="control" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
              <Power className="h-3.5 w-3.5 mr-1 sm:mr-2 shrink-0" />
              站点控制
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>自定义设置</CardTitle>
              <CardDescription>通过"添加设置"手动创建的自定义键值配置（品牌、邮件、SEO、API 等专属设置请前往对应标签页管理）</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const MANAGED_KEYS = new Set([
                  'logo_url', 'logo_dark_url', 'favicon_url', 'site_name', 'site_subtitle', 'footer_text', 'icp_number',
                  'social_github', 'social_twitter', 'social_wechat', 'social_weibo', 'social_facebook',
                  'primary_color', 'secondary_color',
                  'modelscope_api_key', 'modelscope_model', 'modelscope_auto_generate',
                  'pwa_install_banner', 'feedback_button_visible', 'maintenance_mode', 'maintenance_title', 'maintenance_message',
                  'site_closed', 'registration_closed',
                  'whois_api_key', 'whois_provider',
                  'resend_api_key', 'smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'smtp_from_email', 'smtp_from_name',
                  'site_domain', 'contact_email', 'contact_phone', 'contact_wechat', 'contact_address',
                  'emergency_phone', 'hours_online', 'hours_phone', 'hours_weekday',
                  'meta_title', 'meta_description', 'meta_keywords', 'og_title', 'og_description', 'og_image',
                ]);
                const customSettings = getSettingsBySection('general').filter(s => !MANAGED_KEYS.has(s.key));
                return customSettings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="font-medium">暂无自定义设置</p>
                    <p className="text-xs mt-1">点击右上角"添加设置"按钮可手动添加自定义键值配置</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => setIsAddDialogOpen(true)}>
                      添加设置
                    </Button>
                  </div>
                ) : (
                  customSettings.map(setting => (
                    <SettingItem 
                      key={setting.id}
                      setting={setting}
                      onChange={(value) => handleSettingChange(setting.id, value)}
                      onDelete={() => deleteSetting(setting.id)}
                    />
                  ))
                );
              })()}
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
              <div className="space-y-2">
                <Label className="font-semibold">网站域名</Label>
                <p className="text-xs text-muted-foreground">用于邮件通知中的链接和版权信息，填写完整域名（含协议），<strong>必须配置否则邮件链接无效</strong></p>
                {contactInfo.site_domain && contactInfo.site_domain !== window.location.origin && (
                  <Alert className="border-yellow-500/30 bg-yellow-500/5">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-700 dark:text-yellow-400 text-xs">
                      <strong>注意：</strong>当前配置的域名（<code className="font-mono">{contactInfo.site_domain}</code>）与您正在访问的域名（<code className="font-mono">{window.location.origin}</code>）不一致。密码重置邮件中的链接将指向旧域名。请更新为当前域名并保存。
                    </AlertDescription>
                  </Alert>
                )}
                {!contactInfo.site_domain && (
                  <Alert className="border-orange-500/30 bg-orange-500/5">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-700 dark:text-orange-400 text-xs">
                      <strong>未配置：</strong>请填写当前网站域名（如 <code className="font-mono">{window.location.origin}</code>），否则邮件中的重置密码链接将无法正常工作。
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="例：https://yourdomain.com"
                    value={contactInfo.site_domain}
                    onChange={(e) => setContactInfo({ ...contactInfo, site_domain: e.target.value })}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setContactInfo({ ...contactInfo, site_domain: window.location.origin })}
                    className="whitespace-nowrap text-xs"
                  >
                    使用当前域名
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">客服邮箱</Label>
                  <p className="text-xs text-muted-foreground">邮件通知中的支持邮箱地址</p>
                  <Input
                    placeholder="例：support@yourdomain.com"
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
              {/* All-emails-use-this-SMTP notice */}
              <div className="rounded-lg bg-blue-500/10 dark:bg-blue-950/30 border border-blue-500/30 dark:border-blue-800 px-4 py-3 flex gap-3">
                <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-600 dark:text-blue-400 dark:text-blue-300 space-y-0.5">
                  <p className="font-semibold">此 SMTP 是系统唯一邮件出口</p>
                  <p>交易通知、出价提醒、密码重置等<strong>所有系统邮件</strong>均通过此处配置的 SMTP 发送。更换服务商只需修改下方参数并保存，立即生效，无需任何额外操作。</p>
                </div>
              </div>

              {/* Quick-fill presets */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Zap className="h-3 w-3" /> 快速填充服务商参数（点击自动填入主机和端口）
                </p>
                <div className="flex flex-wrap gap-2">
                  {SMTP_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setSmtp(s => ({ ...s, host: p.host, port: p.port }));
                        setSelectedPreset(p.label);
                      }}
                      className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                        selectedPreset === p.label
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-border text-foreground'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                {selectedPreset && (() => {
                  const p = SMTP_PRESETS.find(x => x.label === selectedPreset);
                  return p ? (
                    <div className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground flex gap-2 items-start">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                      <span>
                        <strong>{p.label}</strong>：{p.host} · 端口 {p.port}
                        {p.note ? <span className="ml-2 text-amber-600 dark:text-amber-400">⚠ {p.note}</span> : null}
                      </span>
                    </div>
                  ) : null;
                })()}
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
                  <Alert className="border-green-500/30 bg-green-500/10 dark:border-green-900 dark:bg-green-950/30">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-600 dark:text-green-400 dark:text-green-300 font-medium">{emailTestResult.msg}</AlertDescription>
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

          {/* Email scope info */}
          <div className="rounded-lg border px-4 py-3 space-y-2 text-sm">
            <p className="font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              通过此 SMTP 发送的邮件类型
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-xs text-muted-foreground pl-1">
              <span className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-green-500" /> 用户注册欢迎邮件</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-green-500" /> 找回密码 / 重置密码</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-green-500" /> 新报价通知（卖家）</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-green-500" /> 还价 / 反还价通知</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-green-500" /> 报价被接受 / 拒绝通知</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-green-500" /> 交易状态更新通知</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-green-500" /> 付款确认 / 转移完成</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-green-500" /> 争议受理通知</span>
            </div>
            <p className="text-xs text-muted-foreground pt-1 border-t">
              保存配置后立即生效，切换任意服务商无需重启或额外操作。
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                SEO优化设置
              </CardTitle>
              <CardDescription>配置网站标题、描述、关键词等搜索引擎优化参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getSettingsBySection('seo').length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Globe className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">尚未设置 SEO 配置</p>
                  <p className="text-xs mt-1 mb-4">初始化后将自动填充 meta_title、meta_description、keywords 等基础 SEO 设置</p>
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await apiPost('/data/admin/seed-seo', {});
                        toast.success('SEO 默认设置初始化成功，请刷新页面');
                        await loadSettings();
                      } catch (e: any) {
                        toast.error('初始化失败：' + (e.message || '未知'));
                      }
                    }}
                  >
                    <Puzzle className="h-4 w-4 mr-1.5" />
                    一键初始化默认 SEO 配置
                  </Button>
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

        {/* 品牌与外观 Tab */}
        <TabsContent value="brand" className="space-y-6">
          {/* 基本品牌信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                品牌基本信息
              </CardTitle>
              <CardDescription>配置网站名称、副标题、版权文字和 ICP 备案号</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">网站名称</Label>
                  <Input
                    value={brandInfo.site_name}
                    onChange={e => setBrandInfo(p => ({ ...p, site_name: e.target.value }))}
                    placeholder="例：域见•你"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">网站副标题</Label>
                  <Input
                    value={brandInfo.site_subtitle}
                    onChange={e => setBrandInfo(p => ({ ...p, site_subtitle: e.target.value }))}
                    placeholder="例：专业中文域名交易平台"
                  />
                  <p className="text-xs text-muted-foreground">显示在页脚品牌列</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">页脚版权文字</Label>
                  <Input
                    value={brandInfo.footer_text}
                    onChange={e => setBrandInfo(p => ({ ...p, footer_text: e.target.value }))}
                    placeholder="例：域见•你 域名交易平台。保留所有权利。"
                  />
                  <p className="text-xs text-muted-foreground">显示在页脚底部 © 年份 后面</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">ICP 备案号</Label>
                  <Input
                    value={brandInfo.icp_number}
                    onChange={e => setBrandInfo(p => ({ ...p, icp_number: e.target.value }))}
                    placeholder="例：京ICP备XXXXXXXX号"
                  />
                  <p className="text-xs text-muted-foreground">显示在页脚底部，点击跳转工信部网站</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logo 上传 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Logo 配置
              </CardTitle>
              <CardDescription>
                分别上传浅色和深色模式 Logo（支持 PNG/SVG/WebP，建议透明背景，最大 2MB）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 浅色 Logo */}
                <div className="space-y-3">
                  <Label className="font-semibold">浅色模式 Logo</Label>
                  <div className="border rounded-lg p-4 bg-white flex flex-col items-center gap-3 min-h-[120px] justify-center">
                    {brandInfo.logo_url ? (
                      <img src={brandInfo.logo_url} alt="Light Logo" className="max-h-16 max-w-full object-contain" />
                    ) : (
                      <p className="text-xs text-muted-foreground">未设置 Logo，将显示文字</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">直接上传文件</Label>
                    <input
                      type="file"
                      accept="image/png,image/svg+xml,image/webp,image/jpeg,image/gif"
                      className="hidden"
                      id="logo-light-upload"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) uploadLogo(f, 'light');
                        e.target.value = '';
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={isUploadingLogo === 'light'}
                      onClick={() => document.getElementById('logo-light-upload')?.click()}
                    >
                      {isUploadingLogo === 'light' ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />上传中...</>
                      ) : (
                        '选择文件上传'
                      )}
                    </Button>
                    <Label className="text-xs text-muted-foreground">或填写图片 URL</Label>
                    <Input
                      value={brandInfo.logo_url}
                      onChange={e => setBrandInfo(p => ({ ...p, logo_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {/* 深色 Logo */}
                <div className="space-y-3">
                  <Label className="font-semibold">深色模式 Logo</Label>
                  <div className="border rounded-lg p-4 bg-gray-900 flex flex-col items-center gap-3 min-h-[120px] justify-center">
                    {brandInfo.logo_dark_url ? (
                      <img src={brandInfo.logo_dark_url} alt="Dark Logo" className="max-h-16 max-w-full object-contain" />
                    ) : (
                      <p className="text-xs text-gray-400">未设置深色 Logo，将使用浅色版本</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">直接上传文件</Label>
                    <input
                      type="file"
                      accept="image/png,image/svg+xml,image/webp,image/jpeg,image/gif"
                      className="hidden"
                      id="logo-dark-upload"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) uploadLogo(f, 'dark');
                        e.target.value = '';
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={isUploadingLogo === 'dark'}
                      onClick={() => document.getElementById('logo-dark-upload')?.click()}
                    >
                      {isUploadingLogo === 'dark' ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />上传中...</>
                      ) : (
                        '选择文件上传'
                      )}
                    </Button>
                    <Label className="text-xs text-muted-foreground">或填写图片 URL</Label>
                    <Input
                      value={brandInfo.logo_dark_url}
                      onChange={e => setBrandInfo(p => ({ ...p, logo_dark_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Favicon / Icon */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                网站图标（Favicon / Icon）
              </CardTitle>
              <CardDescription>
                浏览器标签页和书签中显示的小图标。建议尺寸 32×32 或 64×64 像素，支持 PNG / ICO / SVG。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-3">
                  <Label className="font-semibold">当前图标预览</Label>
                  <div className="border rounded-lg p-4 bg-muted/30 flex items-center gap-4 min-h-[80px]">
                    {brandInfo.favicon_url ? (
                      <>
                        <img src={brandInfo.favicon_url} alt="Favicon" className="w-8 h-8 object-contain flex-shrink-0" />
                        <img src={brandInfo.favicon_url} alt="Favicon 16px" className="w-4 h-4 object-contain flex-shrink-0 opacity-70" />
                        <span className="text-xs text-muted-foreground">32px · 16px 预览</span>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">未设置 Favicon，将使用默认图标</p>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="font-semibold">上传图标</Label>
                  <input
                    type="file"
                    accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml,image/webp,image/jpeg"
                    className="hidden"
                    id="favicon-upload"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) uploadLogo(f, 'favicon');
                      e.target.value = '';
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={isUploadingLogo === 'favicon'}
                    onClick={() => document.getElementById('favicon-upload')?.click()}
                  >
                    {isUploadingLogo === 'favicon' ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />上传中...</>
                    ) : (
                      '选择图标文件上传'
                    )}
                  </Button>
                  <Label className="text-xs text-muted-foreground">或填写图标 URL</Label>
                  <Input
                    value={brandInfo.favicon_url}
                    onChange={e => setBrandInfo(p => ({ ...p, favicon_url: e.target.value }))}
                    placeholder="https://... 或 /favicon.ico"
                  />
                  <p className="text-xs text-muted-foreground">保存品牌设置后，刷新页面即可看到新图标。</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 社交媒体链接 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                社交媒体链接
              </CardTitle>
              <CardDescription>配置页脚社交媒体图标链接，留空则不显示该图标</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">GitHub</Label>
                  <Input
                    value={brandInfo.social_github}
                    onChange={e => setBrandInfo(p => ({ ...p, social_github: e.target.value }))}
                    placeholder="https://github.com/yourorg"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">Twitter / X</Label>
                  <Input
                    value={brandInfo.social_twitter}
                    onChange={e => setBrandInfo(p => ({ ...p, social_twitter: e.target.value }))}
                    placeholder="https://twitter.com/yourhandle"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">Facebook</Label>
                  <Input
                    value={brandInfo.social_facebook}
                    onChange={e => setBrandInfo(p => ({ ...p, social_facebook: e.target.value }))}
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">微信公众号（链接或二维码页面）</Label>
                  <Input
                    value={brandInfo.social_wechat}
                    onChange={e => setBrandInfo(p => ({ ...p, social_wechat: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">微博</Label>
                  <Input
                    value={brandInfo.social_weibo}
                    onChange={e => setBrandInfo(p => ({ ...p, social_weibo: e.target.value }))}
                    placeholder="https://weibo.com/yourpage"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={saveBrandConfig} disabled={isSavingBrand} className="px-8">
              {isSavingBrand ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />保存中...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" />保存品牌设置</>
              )}
            </Button>
          </div>
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
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/30 ml-auto">已配置</Badge>
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
                  <Alert className={whoisTestResult.ok ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}>
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
          {/* ModelScope AI */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                ModelScope 魔搭 AI 图像生成
                {msApiKey && (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/30 ml-auto">已配置</Badge>
                )}
              </CardTitle>
              <CardDescription>
                配置 ModelScope API，自动为域名生成黑白风格 Logo。
                获取密钥：<a href="https://modelscope.cn/my/myaccesstoken" target="_blank" rel="noopener noreferrer" className="text-primary underline ml-1">modelscope.cn → 账号 → 访问令牌</a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  推荐模型：<strong>Flux.1 Schnell</strong>（速度快）、<strong>Flux.1 Dev</strong>（质量高）。
                  生成的 Logo 会自动适配黑白主题，存储后显示在首页滚动域名卡片中。
                  <br />
                  <span className="text-xs text-muted-foreground mt-1 block">
                    首次使用需在 ModelScope 账户页面<strong>绑定阿里云账号</strong>，否则 API 请求会返回 401 错误。
                    绑定入口：<a href="https://modelscope.cn/my/myinfo" target="_blank" rel="noopener noreferrer" className="underline">modelscope.cn → 账户信息 → 绑定阿里云</a>
                  </span>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label className="font-semibold">API Key（访问令牌）</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showMsKey ? 'text' : 'password'}
                      placeholder="请输入 ModelScope API Key"
                      value={msApiKey}
                      onChange={(e) => setMsApiKey(e.target.value)}
                      className="pr-10 font-mono"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowMsKey(v => !v)}
                    >
                      {showMsKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">AI 模型</Label>
                <Select value={msModel} onValueChange={setMsModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="black-forest-labs/FLUX.1-schnell">Flux.1 Schnell（速度最快，推荐）</SelectItem>
                    <SelectItem value="stabilityai/stable-diffusion-xl-base-1.0">Stable Diffusion XL（均衡）</SelectItem>
                    <SelectItem value="black-forest-labs/FLUX.1-dev">Flux.1 Dev（最高质量）</SelectItem>
                    <SelectItem value="stabilityai/stable-diffusion-3-5-large">Stable Diffusion 3.5 Large（旗舰）</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">所有模型均使用黑白风格提示词，生成结果与网站风格一致</p>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
                <Switch
                  checked={msAutoGenerate}
                  onCheckedChange={setMsAutoGenerate}
                />
                <div>
                  <p className="text-sm font-medium">添加域名时自动生成 Logo</p>
                  <p className="text-xs text-muted-foreground">在后台添加域名后，自动调用 AI 生成对应的黑白风格域名 Logo</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={saveModelScopeConfig} disabled={isSavingMs}>
                  {isSavingMs ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
                  保存配置
                </Button>
                <Button variant="outline" onClick={testModelScopeApi} disabled={isTestingMs || !msApiKey}>
                  {isTestingMs
                    ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    : <TestTube2 className="h-4 w-4 mr-1.5" />}
                  测试生成
                </Button>
                <Button variant="outline" onClick={batchGenerateHotLogos} disabled={isBatchingHot || isBatchingAuction || !msApiKey}>
                  {isBatchingHot
                    ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    : <Sparkles className="h-4 w-4 mr-1.5" />}
                  批量生成推荐域名 Logo
                </Button>
                <Button variant="outline" onClick={batchGenerateAuctionLogos} disabled={isBatchingHot || isBatchingAuction || !msApiKey}>
                  {isBatchingAuction
                    ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    : <Sparkles className="h-4 w-4 mr-1.5" />}
                  批量生成拍卖域名 Logo
                </Button>
              </div>

              {batchProgress && (
                <p className="text-sm text-muted-foreground font-mono bg-muted/40 rounded px-3 py-2">{batchProgress}</p>
              )}

              {msTestResult && (
                <Alert className={msTestResult.ok ? 'border-green-500/30 bg-green-500/10 dark:border-green-800 dark:bg-green-950/30' : 'border-red-500/30 bg-red-500/10 dark:border-red-800 dark:bg-red-950/30'}>
                  {msTestResult.ok
                    ? <CheckCircle className="h-4 w-4 text-green-600" />
                    : <XCircle className="h-4 w-4 text-red-600" />}
                  <AlertDescription className={msTestResult.ok ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
                    {msTestResult.msg}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 站点控制 ── */}
        <TabsContent value="control" className="space-y-6">
          {siteClosed && (
            <Alert className="border-red-500/40 bg-red-500/10">
              <Power className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-700 dark:text-red-400 font-medium">
                网站目前处于<strong>关闭状态</strong>，非管理员用户将看到维护页面。
              </AlertDescription>
            </Alert>
          )}

          {/* 开关区域 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Power className="h-4 w-4" />
                访问控制
              </CardTitle>
              <CardDescription>控制网站的公开访问权限，修改后立即生效</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 关闭网站 */}
              <div className={`flex items-start justify-between gap-4 p-4 rounded-xl border transition-colors ${siteClosed ? 'border-red-400/50 bg-red-500/5' : 'border-border bg-muted/20'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Wrench className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="text-sm font-semibold text-foreground">关闭网站（维护模式）</p>
                    {siteClosed && <Badge variant="destructive" className="text-xs">已开启</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    开启后，所有非管理员用户访问任何页面时都会跳转到维护页面。管理员可正常访问后台。
                  </p>
                </div>
                <Switch
                  checked={siteClosed}
                  onCheckedChange={setSiteClosed}
                  className="mt-0.5 shrink-0"
                />
              </div>

              {/* 关闭注册 */}
              <div className={`flex items-start justify-between gap-4 p-4 rounded-xl border transition-colors ${registrationClosed ? 'border-amber-400/50 bg-amber-500/5' : 'border-border bg-muted/20'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <UserX className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="text-sm font-semibold text-foreground">关闭注册</p>
                    {registrationClosed && <Badge variant="outline" className="text-xs border-amber-400 text-amber-600">已开启</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    开启后，注册入口将隐藏，新用户无法创建账户。已有账户不受影响，仍可正常登录。
                  </p>
                </div>
                <Switch
                  checked={registrationClosed}
                  onCheckedChange={setRegistrationClosed}
                  className="mt-0.5 shrink-0"
                />
              </div>

              {/* App 安装引导横幅 */}
              <div className={`flex items-start justify-between gap-4 p-4 rounded-xl border transition-colors ${pwaInstallBanner ? 'border-blue-400/50 bg-blue-500/5' : 'border-border bg-muted/20'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Smartphone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="text-sm font-semibold text-foreground">App 安装引导横幅</p>
                    {pwaInstallBanner && <Badge variant="outline" className="text-xs border-blue-400 text-blue-600">已开启</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    向移动端访客展示"添加到主屏幕"引导弹窗，5 秒后自动关闭。关闭此开关后新访客将不再看到提示。
                  </p>
                </div>
                <Switch
                  checked={pwaInstallBanner}
                  onCheckedChange={setPwaInstallBanner}
                  className="mt-0.5 shrink-0"
                />
              </div>

              {/* 反馈按钮 */}
              <div className={`flex items-start justify-between gap-4 p-4 rounded-xl border transition-colors ${feedbackButtonVisible ? 'border-green-400/50 bg-green-500/5' : 'border-border bg-muted/20'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="text-sm font-semibold text-foreground">悬浮反馈按钮</p>
                    {feedbackButtonVisible
                      ? <Badge variant="outline" className="text-xs border-green-400 text-green-600">已显示</Badge>
                      : <Badge variant="outline" className="text-xs border-muted-foreground text-muted-foreground">已隐藏</Badge>
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    页面右下角的"反馈"悬浮按钮。关闭后所有页面的反馈入口将被隐藏，已登录用户也无法看到。
                  </p>
                </div>
                <Switch
                  checked={feedbackButtonVisible}
                  onCheckedChange={setFeedbackButtonVisible}
                  className="mt-0.5 shrink-0"
                />
              </div>
            </CardContent>
          </Card>

          {/* 维护页面内容 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wrench className="h-4 w-4" />
                维护页面内容
              </CardTitle>
              <CardDescription>自定义用户看到的维护页面文案（开启关闭网站后生效）</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="maintenance-title">页面标题</Label>
                <Input
                  id="maintenance-title"
                  value={maintenanceTitle}
                  onChange={e => setMaintenanceTitle(e.target.value)}
                  placeholder="系统维护中"
                  maxLength={40}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="maintenance-msg">说明文字</Label>
                <Textarea
                  id="maintenance-msg"
                  value={maintenanceMessage}
                  onChange={e => setMaintenanceMessage(e.target.value)}
                  placeholder="我们正在对平台进行升级维护，即将回来，感谢您的耐心等待。"
                  rows={3}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground text-right">{maintenanceMessage.length}/200</p>
              </div>
            </CardContent>
          </Card>

          <Button onClick={saveSiteControl} disabled={isSavingControl} className="gap-2">
            {isSavingControl ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            保存控制设置
          </Button>
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
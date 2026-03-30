
import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { supabase } from '@/integrations/supabase/client';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send,
  MessageCircle,
  Headphones,
  Globe,
  Shield,
  Users,
  Building
} from 'lucide-react';

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  subject: string;
  category: string;
  message: string;
}

const contactCategories = [
  { value: 'general', label: '一般咨询' },
  { value: 'technical', label: '技术支持' },
  { value: 'billing', label: '账单问题' },
  { value: 'domain', label: '域名问题' },
  { value: 'verification', label: '验证问题' },
  { value: 'transaction', label: '交易纠纷' },
  { value: 'partnership', label: '合作洽谈' },
  { value: 'other', label: '其他问题' }
];

export const ContactPage: React.FC = () => {
  const { config } = useSiteSettings();
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    category: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof ContactForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('请输入您的姓名');
      return false;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('请输入有效的邮箱地址');
      return false;
    }
    if (!formData.subject.trim()) {
      toast.error('请输入主题');
      return false;
    }
    if (!formData.category) {
      toast.error('请选择问题类型');
      return false;
    }
    if (!formData.message.trim()) {
      toast.error('请输入详细描述');
      return false;
    }
    if (formData.message.trim().length < 10) {
      toast.error('详细描述至少需要10个字符');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const categoryLabels: Record<string, string> = {
        'transaction': '交易问题',
        'domain': '域名相关',
        'account': '账户问题',
        'payment': '支付结算',
        'technical': '技术支持',
        'other': '其他问题',
      };
      const categoryLabel = categoryLabels[formData.category] || formData.category;
      const siteDomain = (config.site_domain || window.location.origin).replace(/\/$/, '');
      const siteName = config.site_name || '域见•你';
      const siteHostname = siteDomain.replace(/^https?:\/\//, '').toUpperCase();
      const supportEmail = config.contact_email || `support@${siteDomain.replace(/^https?:\/\//, '')}`;

      const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>用户联系我们 — 域见•你</title>
  <style>body{margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;}</style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">
        <tr><td style="padding-bottom:24px;text-align:center;">
          <table cellpadding="0" cellspacing="0" role="presentation" style="display:inline-table;">
            <tr><td style="background:#0f172a;border-radius:12px;padding:10px 20px;">
              <span style="color:#f8fafc;font-size:20px;font-weight:800;">${siteName}</span>
              <span style="color:#475569;font-size:11px;font-weight:600;margin-left:10px;letter-spacing:2px;">${siteHostname}</span>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.07);">
          <div style="height:4px;background:linear-gradient(90deg,#0f172a 0%,#334155 50%,#64748b 100%);"></div>
          <div style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid #f1f5f9;">
            <div style="width:64px;height:64px;background:#eff6ff;border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:32px;">✉️</div>
            <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#0f172a;">新客服消息</h1>
            <p style="margin:0;font-size:15px;color:#64748b;">用户通过联系页面发送了一条消息</p>
          </div>
          <div style="padding:32px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:24px;">
              <tr>
                <td style="padding:12px 16px;background:#f8fafc;font-size:12px;font-weight:600;color:#64748b;width:35%;border-bottom:1px solid #f1f5f9;">姓名</td>
                <td style="padding:12px 16px;font-size:14px;color:#0f172a;font-weight:600;border-bottom:1px solid #f1f5f9;">${formData.name}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;background:#f8fafc;font-size:12px;font-weight:600;color:#64748b;width:35%;border-bottom:1px solid #f1f5f9;">邮箱</td>
                <td style="padding:12px 16px;font-size:14px;border-bottom:1px solid #f1f5f9;"><a href="mailto:${formData.email}" style="color:#0f172a;text-decoration:none;font-weight:500;">${formData.email}</a></td>
              </tr>
              ${formData.phone ? `<tr>
                <td style="padding:12px 16px;background:#f8fafc;font-size:12px;font-weight:600;color:#64748b;width:35%;border-bottom:1px solid #f1f5f9;">电话</td>
                <td style="padding:12px 16px;font-size:14px;color:#475569;border-bottom:1px solid #f1f5f9;">${formData.phone}</td>
              </tr>` : ''}
              <tr>
                <td style="padding:12px 16px;background:#f8fafc;font-size:12px;font-weight:600;color:#64748b;width:35%;border-bottom:1px solid #f1f5f9;">问题类型</td>
                <td style="padding:12px 16px;font-size:14px;color:#0f172a;font-weight:700;border-bottom:1px solid #f1f5f9;">${categoryLabel}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;background:#f8fafc;font-size:12px;font-weight:600;color:#64748b;width:35%;">主题</td>
                <td style="padding:12px 16px;font-size:14px;color:#0f172a;font-weight:600;">${formData.subject}</td>
              </tr>
            </table>
            <div style="background:#f8fafc;border-radius:10px;padding:20px;border:1px solid #e2e8f0;">
              <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#64748b;letter-spacing:0.5px;text-transform:uppercase;">消息内容</p>
              <p style="margin:0;font-size:14px;color:#334155;line-height:1.8;white-space:pre-wrap;">${formData.message}</p>
            </div>
            <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;text-align:center;">提交时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })} (北京时间)</p>
            <div style="text-align:center;margin-top:24px;">
              <a href="mailto:${formData.email}" style="display:inline-block;background:#0f172a;color:#f8fafc;padding:12px 32px;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;">回复用户 →</a>
            </div>
          </div>
          <div style="padding:20px 40px;background:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;">
            <p style="margin:0;font-size:13px;color:#94a3b8;">${siteName} 客服系统 · <a href="${siteDomain}/admin" style="color:#475569;text-decoration:none;font-weight:600;">前往管理后台</a></p>
          </div>
        </td></tr>
        <tr><td style="padding:24px 20px 0;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} ${siteName} · ${siteHostname}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

      await supabase.functions.invoke('send-email', {
        body: {
          to: supportEmail,
          subject: `[客服] ${categoryLabel}：${formData.subject} — ${formData.name}`,
          html,
        },
      });
      
      toast.success('消息发送成功！我们会在24小时内回复您。');
      
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        category: '',
        message: ''
      });
    } catch (error) {
      toast.error('发送失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">联系我们</h1>
          <p className="text-xl text-muted-foreground">我们随时为您提供帮助和支持</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 联系表单 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  发送消息
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        姓名 <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="请输入您的姓名"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        邮箱 <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">电话</label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="请输入联系电话（可选）"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        问题类型 <span className="text-red-500">*</span>
                      </label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => handleInputChange('category', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="请选择问题类型" />
                        </SelectTrigger>
                        <SelectContent>
                          {contactCategories.map(category => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      主题 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      placeholder="简要描述您的问题"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      详细描述 <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="请详细描述您遇到的问题或需要的帮助..."
                      className="min-h-[120px]"
                      required
                    />
                    <div className="text-xs text-muted-foreground">
                      {formData.message.length}/500
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        发送中...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        发送消息
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* 联系信息和其他支持方式 */}
          <div className="space-y-6">
            {/* 联系方式 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  联系方式
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {config.contact_email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                      <div className="font-medium">客服邮箱</div>
                      <div className="text-muted-foreground">{config.contact_email}</div>
                      <div className="text-sm text-muted-foreground">24小时内回复</div>
                    </div>
                  </div>
                )}

                {config.contact_phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                      <div className="font-medium">客服电话</div>
                      <div className="text-muted-foreground">{config.contact_phone}</div>
                      <div className="text-sm text-muted-foreground">{config.hours_weekday} {config.hours_phone}</div>
                    </div>
                  </div>
                )}

                {config.contact_address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                      <div className="font-medium">公司地址</div>
                      <div className="text-muted-foreground whitespace-pre-line">{config.contact_address}</div>
                    </div>
                  </div>
                )}

                {!config.contact_email && !config.contact_phone && !config.contact_address && (
                  <div className="text-sm text-muted-foreground text-center py-2">联系方式待配置，请通过下方表单留言</div>
                )}
              </CardContent>
            </Card>

            {/* 工作时间 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  服务时间
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>在线客服</span>
                  <span className="text-muted-foreground">{config.hours_online || '9:00 - 18:00'}</span>
                </div>
                <div className="flex justify-between">
                  <span>邮箱支持</span>
                  <span className="text-muted-foreground">24小时</span>
                </div>
                <div className="flex justify-between">
                  <span>电话支持</span>
                  <span className="text-muted-foreground">{config.hours_phone || '9:00 - 18:00'}</span>
                </div>
                <div className="text-sm text-muted-foreground pt-2 border-t">
                  {config.hours_weekday || '周一至周五（节假日除外）'}
                </div>
              </CardContent>
            </Card>

            {/* 其他支持方式 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Headphones className="h-5 w-5" />
                  其他支持
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <a href="/faq" className="block">
                    <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg hover:bg-blue-500/15 transition-colors cursor-pointer">
                      <Globe className="h-6 w-6 text-blue-500" />
                      <div className="flex-1">
                        <div className="font-medium">在线帮助中心</div>
                        <div className="text-sm text-muted-foreground">查看常见问题</div>
                      </div>
                    </div>
                  </a>

                  <a href="/community" className="block">
                    <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg hover:bg-green-500/15 transition-colors cursor-pointer">
                      <Users className="h-6 w-6 text-green-500" />
                      <div className="flex-1">
                        <div className="font-medium">用户社区</div>
                        <div className="text-sm text-muted-foreground">与其他用户交流</div>
                      </div>
                    </div>
                  </a>

                  <a href="/security-center" className="block">
                    <div className="flex items-center gap-3 p-3 bg-purple-500/10 rounded-lg hover:bg-purple-500/15 transition-colors cursor-pointer">
                      <Shield className="h-6 w-6 text-purple-500" />
                      <div className="flex-1">
                        <div className="font-medium">安全中心</div>
                        <div className="text-sm text-muted-foreground">账户安全指引</div>
                      </div>
                    </div>
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* 紧急联系 */}
            {config.emergency_phone && (
              <Card className="border-red-500/30 bg-red-500/10">
                <CardHeader>
                  <CardTitle className="text-red-700 flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    紧急情况
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-700 text-sm">
                    如遇到账户安全问题或紧急交易纠纷，
                    请立即拨打紧急热线：
                  </p>
                  <div className="font-bold text-red-600 dark:text-red-400 text-lg mt-2">
                    {config.emergency_phone}
                  </div>
                  <p className="text-red-600 text-xs mt-1">
                    24小时紧急服务热线
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;

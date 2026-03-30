import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Shield, Clock, CheckCircle2, MessageSquare, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const DISPUTE_TYPES = [
  { value: 'no_transfer', label: '域名未转移 - 付款后卖家未完成域名转移' },
  { value: 'no_payment', label: '资金未到账 - 完成转移后资金未释放' },
  { value: 'wrong_domain', label: '域名不符 - 转移的域名与约定不符' },
  { value: 'fraud', label: '涉嫌欺诈 - 怀疑对方存在欺诈行为' },
  { value: 'other', label: '其他纠纷' },
];

const PROCESS_STEPS = [
  { icon: FileText, title: '提交申诉', desc: '填写纠纷详情，上传相关证据（截图、合同等）。' },
  { icon: Clock, title: '平台受理', desc: '工作日 24 小时内受理，冻结相关资金，通知对方。' },
  { icon: MessageSquare, title: '调查处理', desc: '平台介入调查，听取双方陈述，审核交易记录。' },
  { icon: CheckCircle2, title: '出具结论', desc: '根据调查结果出具仲裁决定，公正保障双方权益。' },
];

export default function DisputePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { config } = useSiteSettings();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    transaction_id: '',
    dispute_type: '',
    opponent_email: '',
    amount: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate('/auth'); return; }
    if (!form.dispute_type || !form.description) {
      toast.error('请填写纠纷类型和详情描述');
      return;
    }
    setSubmitting(true);
    try {
      const disputeLabel = DISPUTE_TYPES.find(d => d.value === form.dispute_type)?.label || form.dispute_type;
      const siteDomain = (config.site_domain || window.location.origin).replace(/\/$/, '');
      const siteName = config.site_name || '域见•你';
      const siteHostname = siteDomain.replace(/^https?:\/\//, '').toUpperCase();
      const supportEmail = config.contact_email || `support@${siteDomain.replace(/^https?:\/\//, '')}`;
      const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>纠纷申诉 — 域见•你</title>
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
          <div style="height:4px;background:linear-gradient(90deg,#dc2626,#f97316);"></div>
          <div style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid #f1f5f9;">
            <div style="width:64px;height:64px;background:#fef2f2;border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:32px;">⚠️</div>
            <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#0f172a;">新纠纷申诉</h1>
            <p style="margin:0;font-size:15px;color:#64748b;">一名用户提交了交易纠纷申诉，请尽快处理</p>
          </div>
          <div style="padding:32px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:24px;">
              <tr>
                <td style="padding:12px 16px;background:#f8fafc;font-size:12px;font-weight:600;color:#64748b;width:35%;border-bottom:1px solid #f1f5f9;">申诉人</td>
                <td style="padding:12px 16px;font-size:14px;color:#0f172a;font-weight:600;border-bottom:1px solid #f1f5f9;">${user.email}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;background:#f8fafc;font-size:12px;font-weight:600;color:#64748b;width:35%;border-bottom:1px solid #f1f5f9;">纠纷类型</td>
                <td style="padding:12px 16px;font-size:14px;color:#dc2626;font-weight:700;border-bottom:1px solid #f1f5f9;">${disputeLabel}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;background:#f8fafc;font-size:12px;font-weight:600;color:#64748b;width:35%;border-bottom:1px solid #f1f5f9;">交易 ID</td>
                <td style="padding:12px 16px;font-size:14px;color:#475569;font-family:monospace;border-bottom:1px solid #f1f5f9;">${form.transaction_id || '未提供'}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;background:#f8fafc;font-size:12px;font-weight:600;color:#64748b;width:35%;border-bottom:1px solid #f1f5f9;">对方邮箱</td>
                <td style="padding:12px 16px;font-size:14px;color:#475569;border-bottom:1px solid #f1f5f9;">${form.opponent_email || '未提供'}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;background:#f8fafc;font-size:12px;font-weight:600;color:#64748b;width:35%;">涉及金额</td>
                <td style="padding:12px 16px;font-size:14px;color:#0f172a;font-weight:700;">${form.amount ? `$${parseFloat(form.amount).toLocaleString()}` : '未提供'}</td>
              </tr>
            </table>
            <div style="background:#f8fafc;border-radius:10px;padding:20px;border:1px solid #e2e8f0;">
              <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#64748b;letter-spacing:0.5px;text-transform:uppercase;">详细描述</p>
              <p style="margin:0;font-size:14px;color:#334155;line-height:1.8;white-space:pre-wrap;">${form.description}</p>
            </div>
            <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;text-align:center;">提交时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })} (北京时间)</p>
          </div>
          <div style="padding:20px 40px;background:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;">
            <p style="margin:0;font-size:13px;color:#94a3b8;">${siteName} 后台管理 · <a href="${siteDomain}/admin" style="color:#475569;text-decoration:none;font-weight:600;">前往处理</a></p>
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
          subject: `[纠纷申诉] ${disputeLabel} — ${user.email}`,
          html,
        },
      });
      setSubmitted(true);
    } catch {
      toast.error(`提交失败，请稍后重试或发送邮件至 ${supportEmail}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="pt-16 pb-8 px-4 text-center border-b border-border/50">
          <div className="max-w-3xl mx-auto">
            <Badge variant="destructive" className="mb-4">纠纷处理</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">纠纷申诉</h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              遇到交易纠纷？平台介入调查，资金冻结保护，公正解决每一起争议。
            </p>
          </div>
        </section>

        <section className="py-10 px-4">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">申诉处理流程</h2>
                <div className="space-y-3">
                  {PROCESS_STEPS.map((s, i) => (
                    <div key={s.title} className="flex gap-3 items-start bg-card rounded-xl border border-border p-4">
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{s.title}</p>
                        <p className="text-xs text-muted-foreground">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm mb-1">申诉前请注意</p>
                    <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1">
                      <li>• 请先尝试与对方直接沟通协商</li>
                      <li>• 准备好相关截图和交易记录</li>
                      <li>• 恶意申诉将导致账号受到限制</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div>
              {submitted ? (
                <Card>
                  <CardContent className="pt-8 pb-8 text-center">
                    <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">申诉已提交</h3>
                    <p className="text-muted-foreground text-sm mb-4">平台将在工作日 24 小时内联系你，请留意邮箱通知。</p>
                    <Button variant="outline" onClick={() => navigate('/user-center?tab=transactions')} data-testid="button-dispute-transactions">
                      查看我的交易
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      提交纠纷申诉
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!user && (
                      <div className="mb-5 p-4 bg-muted rounded-lg text-sm text-center">
                        <p className="text-muted-foreground mb-2">请先登录后提交申诉</p>
                        <Button size="sm" onClick={() => navigate('/auth')} data-testid="button-dispute-login">立即登录</Button>
                      </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label className="text-sm mb-1.5 block">纠纷类型 *</Label>
                        <Select value={form.dispute_type} onValueChange={(v) => setForm(f => ({ ...f, dispute_type: v }))}>
                          <SelectTrigger data-testid="select-dispute-type">
                            <SelectValue placeholder="选择纠纷类型" />
                          </SelectTrigger>
                          <SelectContent>
                            {DISPUTE_TYPES.map(t => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm mb-1.5 block">交易 ID（如有）</Label>
                        <Input
                          placeholder="粘贴交易记录 ID"
                          value={form.transaction_id}
                          onChange={e => setForm(f => ({ ...f, transaction_id: e.target.value }))}
                          data-testid="input-dispute-transaction"
                        />
                      </div>
                      <div>
                        <Label className="text-sm mb-1.5 block">对方邮箱或用户名</Label>
                        <Input
                          placeholder="对方的联系信息"
                          value={form.opponent_email}
                          onChange={e => setForm(f => ({ ...f, opponent_email: e.target.value }))}
                          data-testid="input-dispute-opponent"
                        />
                      </div>
                      <div>
                        <Label className="text-sm mb-1.5 block">涉及金额（元）</Label>
                        <Input
                          type="number"
                          placeholder="如: 5000"
                          value={form.amount}
                          onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                          data-testid="input-dispute-amount"
                        />
                      </div>
                      <div>
                        <Label className="text-sm mb-1.5 block">详细描述 *</Label>
                        <Textarea
                          placeholder="请详细描述纠纷经过、时间线、损失情况..."
                          rows={5}
                          value={form.description}
                          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                          data-testid="textarea-dispute-description"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={submitting || !user}
                        data-testid="button-dispute-submit"
                      >
                        {submitting ? '提交中...' : '提交申诉'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

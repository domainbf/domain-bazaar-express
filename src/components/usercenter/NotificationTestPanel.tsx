import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Mail, Bell, Loader2, CheckCircle2, XCircle, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';

type Result = { channel: 'email' | 'site'; ok: boolean; message: string; at: Date } | null;

export const NotificationTestPanel = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? '');
  const [sending, setSending] = useState<'email' | 'site' | null>(null);
  const [result, setResult] = useState<Result>(null);

  const testEmail = async () => {
    const to = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      setResult({ channel: 'email', ok: false, message: '邮箱格式不正确', at: new Date() });
      return;
    }
    setSending('email');
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to,
          subject: '【测试】通知邮件发送测试',
          html: `<div style="font-family:system-ui;padding:24px">
            <h2>邮件通道测试成功</h2>
            <p>这是一封来自站内「通知设置」的测试邮件，说明你的邮件提醒通道工作正常。</p>
            <p style="color:#888;font-size:12px">发送时间：${new Date().toLocaleString('zh-CN')}</p>
          </div>`,
        },
      });
      if (error) throw new Error(error.message);
      if (data && (data as any).success === false) throw new Error((data as any).error || '邮件服务返回失败');
      setResult({ channel: 'email', ok: true, message: `测试邮件已发送至 ${to}`, at: new Date() });
      toast.success('测试邮件已发送');
    } catch (e: any) {
      const msg = e?.message || '未知错误';
      setResult({
        channel: 'email',
        ok: false,
        message: `${msg}${/smtp|auth|credential/i.test(msg) ? '（请检查后台 SMTP / Resend 配置）' : ''}`,
        at: new Date(),
      });
      toast.error('测试邮件发送失败');
    } finally {
      setSending(null);
    }
  };

  const testSite = async () => {
    if (!user) return;
    setSending('site');
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: user.id,
        title: '🔔 站内通知测试',
        message: '这是一条测试通知，说明站内提醒通道工作正常。',
        type: 'system',
      });
      if (error) throw new Error(error.message);
      setResult({ channel: 'site', ok: true, message: '测试通知已写入，请查看通知中心', at: new Date() });
      toast.success('测试通知已发送');
    } catch (e: any) {
      setResult({ channel: 'site', ok: false, message: e?.message || '未知错误', at: new Date() });
      toast.error('测试通知发送失败');
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="border rounded-lg p-3 space-y-3">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-4 w-4" />
        <p className="text-sm font-medium">告警测试发送</p>
        <span className="text-xs text-muted-foreground">立即验证邮件与站内通道是否正常</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="接收测试邮件的邮箱"
          className="h-9"
          aria-label="测试邮箱"
        />
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={testEmail} disabled={sending !== null}>
            {sending === 'email' ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Mail className="h-3.5 w-3.5 mr-1" />}
            发送测试邮件
          </Button>
          <Button size="sm" variant="outline" onClick={testSite} disabled={sending !== null}>
            {sending === 'site' ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Bell className="h-3.5 w-3.5 mr-1" />}
            发送站内测试
          </Button>
        </div>
      </div>

      {result && (
        <div className={`rounded-md border p-2.5 text-xs flex items-start gap-2 ${result.ok ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'}`}>
          {result.ok ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> : <XCircle className="h-4 w-4 text-destructive shrink-0" />}
          <div className="min-w-0">
            <p className="font-medium flex items-center gap-1.5">
              {result.channel === 'email' ? '邮件通道' : '站内通道'}
              <Badge variant={result.ok ? 'outline' : 'destructive'} className="text-[10px]">
                {result.ok ? '成功' : '失败'}
              </Badge>
              <span className="text-muted-foreground font-normal">{result.at.toLocaleTimeString('zh-CN')}</span>
            </p>
            <p className="text-muted-foreground break-all">{result.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationTestPanel;

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Bell, Mail, Loader2 } from 'lucide-react';

type Prefs = Record<string, boolean>;

const DEFAULTS: Prefs = {
  email_offer: true, email_transaction: true, email_message: false,
  email_dispute: true, email_system: false,
  site_offer: true, site_transaction: true, site_message: true,
  site_dispute: true, site_system: true,
};

const GROUPS: { key: string; label: string; desc: string }[] = [
  { key: 'offer', label: '报价通知', desc: '收到/发送域名报价、报价被接受或拒绝' },
  { key: 'transaction', label: '交易通知', desc: '订单状态、付款、过户与完成' },
  { key: 'message', label: '站内消息', desc: '来自其他用户的私信' },
  { key: 'dispute', label: '纠纷通知', desc: '纠纷申诉、进展与裁决' },
  { key: 'system', label: '系统通知', desc: '系统公告、维护与安全提醒' },
];

export const NotificationSettings = () => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('notification_prefs')
        .eq('id', user.id)
        .maybeSingle();
      if (data?.notification_prefs) setPrefs({ ...DEFAULTS, ...data.notification_prefs });
      setLoading(false);
    })();
  }, [user]);

  const toggle = (k: string) => setPrefs(p => ({ ...p, [k]: !p[k] }));

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ notification_prefs: prefs })
        .eq('id', user.id);
      if (error) throw error;
      toast.success('通知偏好已保存');
    } catch (e: any) {
      toast.error('保存失败：' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />通知偏好</CardTitle>
        <p className="text-sm text-muted-foreground">按类型选择接收方式（邮件 / 站内），可随时调整。</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center text-xs font-medium text-muted-foreground px-2">
          <span>类别</span>
          <span className="flex items-center gap-1"><Mail className="h-3 w-3" />邮件</span>
          <span className="flex items-center gap-1"><Bell className="h-3 w-3" />站内</span>
        </div>
        {GROUPS.map(g => (
          <div key={g.key} className="grid grid-cols-[1fr_auto_auto] gap-3 items-center border rounded-lg p-3">
            <div>
              <p className="text-sm font-medium">{g.label}</p>
              <p className="text-xs text-muted-foreground">{g.desc}</p>
            </div>
            <Switch checked={prefs[`email_${g.key}`]} onCheckedChange={() => toggle(`email_${g.key}`)} aria-label={`邮件-${g.label}`} />
            <Switch checked={prefs[`site_${g.key}`]} onCheckedChange={() => toggle(`site_${g.key}`)} aria-label={`站内-${g.label}`} />
          </div>
        ))}
        <div className="flex justify-end pt-2">
          <Button onClick={save} disabled={saving}>{saving ? '保存中…' : '保存偏好'}</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;

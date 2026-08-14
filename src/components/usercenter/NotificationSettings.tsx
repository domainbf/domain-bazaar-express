import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Bell, Mail, Loader2, Check, RotateCcw } from 'lucide-react';

type Prefs = Record<string, any>;

const DEFAULTS: Prefs = {
  email_offer: true, email_transaction: true, email_message: false,
  email_dispute: true, email_system: false,
  site_offer: true, site_transaction: true, site_message: true,
  site_dispute: true, site_system: true,
  email_enabled: true,
  email_frequency: 'instant', // instant | daily | weekly
  site_enabled: true,
  site_sound: false,
};

const GROUPS: { key: string; label: string; desc: string }[] = [
  { key: 'offer', label: '报价通知', desc: '收到/发送域名报价、报价被接受或拒绝' },
  { key: 'transaction', label: '交易通知', desc: '订单状态、付款、过户与完成' },
  { key: 'message', label: '站内消息', desc: '来自其他用户的私信' },
  { key: 'dispute', label: '纠纷通知', desc: '纠纷申诉、进展与裁决' },
  { key: 'system', label: '系统通知', desc: '系统公告、维护与安全提醒' },
];

const FREQUENCIES: { value: string; label: string; desc: string }[] = [
  { value: 'instant', label: '实时发送', desc: '事件发生后立即发送邮件' },
  { value: 'daily', label: '每日汇总', desc: '每天汇总为一封邮件发送' },
  { value: 'weekly', label: '每周汇总', desc: '每周汇总为一封邮件发送' },
];

const isSame = (a: Prefs, b: Prefs) =>
  Object.keys({ ...a, ...b }).every((k) =>
    typeof a[k] === 'string' || typeof b[k] === 'string'
      ? String(a[k] ?? '') === String(b[k] ?? '')
      : Boolean(a[k]) === Boolean(b[k])
  );

export const NotificationSettings = () => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [saved, setSaved] = useState<Prefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);
  const dirtyRef = useRef(false);

  dirtyRef.current = !isSame(prefs, saved);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('notification_prefs')
        .eq('id', user.id)
        .maybeSingle();
      if (!active) return;
      const next = { ...DEFAULTS, ...((data?.notification_prefs as Prefs) || {}) };
      setPrefs(next);
      setSaved(next);
      setSyncedAt(new Date());
      setLoading(false);
    })();
    return () => { active = false; };
  }, [user]);

  // 实时同步：其他设备/标签页修改偏好后自动更新（本地有未保存改动时不覆盖）
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notif-prefs-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          const incoming = (payload.new as any)?.notification_prefs as Prefs | null;
          if (!incoming) return;
          const next = { ...DEFAULTS, ...incoming };
          setSaved(next);
          setSyncedAt(new Date());
          if (!dirtyRef.current) setPrefs(next);
        }
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user]);

  const toggle = (k: string) => setPrefs(p => ({ ...p, [k]: !p[k] }));
  const setValue = (k: string, v: any) => setPrefs(p => ({ ...p, [k]: v }));

  const setAll = (value: boolean) =>
    setPrefs(p => ({
      ...p,
      ...Object.fromEntries(
        Object.keys(DEFAULTS)
          .filter(k => typeof DEFAULTS[k] === 'boolean')
          .map(k => [k, value])
      ),
    }));

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ notification_prefs: prefs })
        .eq('id', user.id);
      if (error) throw error;
      setSaved(prefs);
      setSyncedAt(new Date());
      toast.success('通知偏好已保存');
    } catch (e: any) {
      toast.error('保存失败：' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  const dirty = !isSame(prefs, saved);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 flex-wrap">
          <Bell className="h-5 w-5" />通知偏好
          {dirty ? (
            <Badge variant="secondary" className="ml-auto text-xs">有未保存改动</Badge>
          ) : (
            <Badge variant="outline" className="ml-auto text-xs">
              <Check className="h-3 w-3 mr-1" />已同步
              {syncedAt && ` · ${syncedAt.toLocaleTimeString('zh-CN')}`}
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">按类型选择接收方式（邮件 / 站内），修改后会实时同步到其他设备。</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setAll(true)}>全部开启</Button>
          <Button variant="outline" size="sm" onClick={() => setAll(false)}>全部关闭</Button>
          <Button variant="ghost" size="sm" onClick={() => setPrefs(saved)} disabled={!dirty}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" />撤销
          </Button>
        </div>

        {/* 总开关与邮件频率 */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="border rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5"><Mail className="h-4 w-4" />邮件提醒</p>
                <p className="text-xs text-muted-foreground">关闭后不再发送任何提醒邮件</p>
              </div>
              <Switch checked={!!prefs.email_enabled} onCheckedChange={() => toggle('email_enabled')} aria-label="邮件提醒总开关" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">发送频率</label>
              <Select
                value={String(prefs.email_frequency || 'instant')}
                onValueChange={(v) => setValue('email_frequency', v)}
                disabled={!prefs.email_enabled}
              >
                <SelectTrigger className="h-9"><SelectValue placeholder="选择频率" /></SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                {FREQUENCIES.find(f => f.value === (prefs.email_frequency || 'instant'))?.desc}
              </p>
            </div>
          </div>

          <div className="border rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5"><Bell className="h-4 w-4" />站内提醒</p>
                <p className="text-xs text-muted-foreground">在站内通知中心与弹窗中显示</p>
              </div>
              <Switch checked={!!prefs.site_enabled} onCheckedChange={() => toggle('site_enabled')} aria-label="站内提醒总开关" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">提示音</p>
                <p className="text-xs text-muted-foreground">收到新通知时播放提示音</p>
              </div>
              <Switch checked={!!prefs.site_sound} onCheckedChange={() => toggle('site_sound')} disabled={!prefs.site_enabled} aria-label="提示音" />
            </div>
          </div>
        </div>

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
          <Button onClick={save} disabled={saving || !dirty}>{saving ? '保存中…' : '保存偏好'}</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;

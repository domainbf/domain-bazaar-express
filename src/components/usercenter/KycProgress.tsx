import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ShieldCheck, Clock, CheckCircle2, XCircle, AlertTriangle,
  FileText, IdCard, UserSquare, Wallet, ArrowDown, Loader2
} from 'lucide-react';

interface KycRow {
  id: string;
  status: string;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  full_name: string | null;
  id_number: string | null;
  payout_account: string | null;
  id_front_url: string | null;
  id_back_url: string | null;
  id_selfie_url: string | null;
}

const STATUS: Record<string, { label: string; tone: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any; hint: string }> = {
  none: { label: '未提交', tone: 'outline', icon: AlertTriangle, hint: '首次提现前需完成实名认证并绑定收款账户。' },
  incomplete: { label: '待补充', tone: 'outline', icon: AlertTriangle, hint: '资料不完整，请补齐后提交审核。' },
  pending: { label: '审核中', tone: 'secondary', icon: Clock, hint: '资料已进入审核队列，1-3 个工作日内出结果。' },
  approved: { label: '已通过', tone: 'default', icon: CheckCircle2, hint: '认证已通过，您可以正常发起提现与过户。' },
  rejected: { label: '已退回', tone: 'destructive', icon: XCircle, hint: '审核未通过，请根据退回原因修改资料后重新提交。' },
};

const STEPS = ['填写资料', '上传证件', '提交审核', '审核结果'];

/** KYC 进度总览：审核状态、资料清单、退回后一键补充 */
export const KycProgress = ({ onFix, kycType = 'seller' }: { onFix?: () => void; kycType?: 'seller' | 'buyer' }) => {
  const { user } = useAuth();
  const [row, setRow] = useState<KycRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from('seller_kyc')
      .select('id,status,review_note,reviewed_at,created_at,updated_at,full_name,id_number,payout_account,id_front_url,id_back_url,id_selfie_url')
      .eq('user_id', user.id)
      .eq('kyc_type', kycType)
      .maybeSingle();
    setRow((data as KycRow) || null);
    setLoading(false);
  }, [user, kycType]);


  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`kyc-progress-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'seller_kyc', filter: `user_id=eq.${user.id}` },
        () => load()
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user, load]);

  const status = row?.status || 'none';
  const meta = STATUS[status] ?? STATUS.none;

  const checklist = [
    { key: 'basic', label: '真实姓名与证件号', icon: FileText, done: !!(row?.full_name?.trim() && row?.id_number?.trim()) },
    { key: 'payout', label: '收款账户信息', icon: Wallet, done: !!row?.payout_account?.trim() },
    { key: 'front', label: '证件正面照', icon: IdCard, done: !!row?.id_front_url },
    { key: 'back', label: '证件反面照', icon: IdCard, done: !!row?.id_back_url },
    { key: 'selfie', label: '手持证件自拍', icon: UserSquare, done: !!row?.id_selfie_url },
  ];
  const doneCount = checklist.filter(c => c.done).length;
  const percent = Math.round((doneCount / checklist.length) * 100);

  const currentStep =
    status === 'approved' || status === 'rejected' ? 4
    : status === 'pending' ? 3
    : doneCount >= 2 ? 2
    : row ? 1 : 0;

  const scrollToForm = () => {
    onFix?.();
    document.getElementById('kyc-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <Card><CardContent className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></CardContent></Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base flex-wrap">
          <ShieldCheck className="h-4 w-4" />认证进度
          <Badge variant={meta.tone} className="ml-auto">
            <meta.icon className="h-3 w-3 mr-1" />{meta.label}
          </Badge>
        </CardTitle>
        <CardDescription>{meta.hint}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 步骤条 */}
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => {
            const active = i < currentStep;
            const failed = status === 'rejected' && i === 3;
            return (
              <div key={s} className="flex-1 min-w-0">
                <div
                  className={`h-1.5 rounded-full ${
                    failed ? 'bg-destructive' : active ? 'bg-foreground' : 'bg-muted'
                  }`}
                />
                <p className={`mt-1.5 text-[11px] truncate ${active || failed ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s}
                </p>
              </div>
            );
          })}
        </div>

        {/* 退回提示 + 一键补充 */}
        {status === 'rejected' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle className="text-sm">审核被退回</AlertTitle>
            <AlertDescription className="text-xs space-y-2">
              <p>{row?.review_note?.trim() || '审核员未填写具体原因，请核对证件信息与收款账户后重新提交。'}</p>
              {row?.reviewed_at && <p className="opacity-80">审核时间：{new Date(row.reviewed_at).toLocaleString('zh-CN')}</p>}
              <Button size="sm" variant="secondary" onClick={scrollToForm} className="mt-1">
                <ArrowDown className="h-3.5 w-3.5 mr-1" />一键补充并重新提交
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* 资料清单 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">资料完整度</span>
            <span className="font-medium tabular-nums">{doneCount}/{checklist.length} · {percent}%</span>
          </div>
          <Progress value={percent} className="h-1.5" />
          <div className="grid gap-1.5 sm:grid-cols-2 pt-1">
            {checklist.map(c => {
              const Icon = c.icon;
              return (
                <div
                  key={c.key}
                  className={`flex items-center gap-2 text-xs rounded-lg border px-2.5 py-2 ${
                    c.done ? 'border-border text-muted-foreground' : 'border-dashed border-warning/50 text-foreground'
                  }`}
                >
                  {c.done
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                    : <Icon className="h-3.5 w-3.5 text-warning shrink-0" />}
                  <span className="truncate">{c.label}</span>
                  {!c.done && <span className="ml-auto text-[10px] text-warning shrink-0">待补充</span>}
                </div>
              );
            })}
          </div>
        </div>

        {percent < 100 && status !== 'pending' && status !== 'approved' && (
          <Button size="sm" variant="outline" onClick={scrollToForm} className="w-full sm:w-auto">
            <ArrowDown className="h-3.5 w-3.5 mr-1" />前往补充资料
          </Button>
        )}

        {row?.updated_at && (
          <p className="text-[11px] text-muted-foreground">
            最近更新：{new Date(row.updated_at).toLocaleString('zh-CN')}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default KycProgress;

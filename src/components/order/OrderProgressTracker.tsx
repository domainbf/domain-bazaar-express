import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, CircleDot, Circle, RefreshCw, Bell, ShieldAlert, PackageCheck, Handshake } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';


const STAGES = [
  { key: 'submitted', label: '订单提交', desc: '订单已创建，等待支付' },
  { key: 'paid', label: '支付确认', desc: '收到支付回执，资金到账' },
  { key: 'activated', label: '域名激活', desc: 'DNS 与 SSL 生效' },
  { key: 'transferred', label: '过户 / 续费完成', desc: '所有权已转移至你的账户' },
] as const;

type StageKey = (typeof STAGES)[number]['key'];

interface Props {
  orderId: string;
  initialStage?: StageKey;
  initialHistory?: Record<string, string>;
  buyerId?: string | null;
  sellerId?: string | null;
}

export function OrderProgressTracker({ orderId, initialStage = 'submitted', initialHistory = {}, buyerId, sellerId }: Props) {
  const { user } = useAuth();
  const [stage, setStage] = useState<StageKey>(initialStage);
  const [history, setHistory] = useState<Record<string, string>>(initialHistory);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState(false);
  const prevStageRef = useRef<StageKey>(initialStage);


  const load = async () => {
    setRefreshing(true);
    const { data } = await supabase
      .from('transactions')
      .select('progress_stage, stage_history')
      .eq('id', orderId)
      .maybeSingle();
    if (data) {
      setStage(((data as any).progress_stage as StageKey) || 'submitted');
      setHistory(((data as any).stage_history as Record<string, string>) || {});
    }
    setRefreshing(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'transactions', filter: `id=eq.${orderId}` },
        (payload) => {
          const n: any = payload.new;
          if (n?.progress_stage && n.progress_stage !== prevStageRef.current) {
            const stageMeta = STAGES.find((s) => s.key === n.progress_stage);
            if (stageMeta) {
              toast.success(`订单进入：${stageMeta.label}`, { description: stageMeta.desc });
              // Browser push notification if permitted
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                try {
                  new Notification('订单进度更新', { body: stageMeta.label + ' · ' + stageMeta.desc });
                } catch {}
              }
            }
            prevStageRef.current = n.progress_stage;
            setStage(n.progress_stage);
          }
          if (n?.stage_history) setHistory(n.stage_history);
        }
      )
      .subscribe();
    // Request notification permission once on mount
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const currentIdx = STAGES.findIndex((s) => s.key === stage);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">订单进度</div>
          <div className="text-sm font-semibold mt-0.5">
            当前阶段：<span className="text-primary">{STAGES[Math.max(currentIdx, 0)].label}</span>
          </div>
        </div>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="sm" onClick={load} disabled={refreshing}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} /> 刷新
          </Button>
          <Link to="/notifications">
            <Button variant="ghost" size="sm">
              <Bell className="w-3.5 h-3.5 mr-1.5" /> 通知
            </Button>
          </Link>
          <Link to={`/dispute?order=${orderId}`}>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
              <ShieldAlert className="w-3.5 h-3.5 mr-1.5" /> 申诉
            </Button>
          </Link>
        </div>
      </div>

      <ol className="relative">
        {STAGES.map((s, i) => {
          const done = i < currentIdx || (i === currentIdx && i === STAGES.length - 1 && stage === s.key && history[s.key]);
          const active = i === currentIdx;
          const ts = history[s.key];
          return (
            <li key={s.key} className="flex gap-3 pb-5 last:pb-0 relative">
              {i < STAGES.length - 1 && (
                <span
                  className={`absolute left-[11px] top-6 bottom-0 w-px ${
                    i < currentIdx ? 'bg-primary' : 'bg-border'
                  }`}
                />
              )}
              <motion.div
                initial={false}
                animate={{ scale: active ? [1, 1.15, 1] : 1 }}
                transition={{ duration: 1.6, repeat: active ? Infinity : 0 }}
                className="relative z-10 mt-0.5 shrink-0"
              >
                {i < currentIdx ? (
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                ) : active ? (
                  <CircleDot className="w-6 h-6 text-primary" />
                ) : (
                  <Circle className="w-6 h-6 text-muted-foreground/40" />
                )}
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className={`text-sm font-semibold ${active ? 'text-foreground' : i < currentIdx ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {s.label}
                  </div>
                  {ts && (
                    <div className="text-[11px] text-muted-foreground tabular-nums">
                      {new Date(ts).toLocaleString('zh-CN')}
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.desc}</div>
              </div>
            </li>
          );
        })}
      </ol>

      {(() => {
        const isSeller = !!user && sellerId && user.id === sellerId;
        const isBuyer = !!user && buyerId && user.id === buyerId;
        const canPushTransfer = isSeller && stage === 'activated';
        const canConfirmReceipt = isBuyer && stage === 'transferred';
        if (!canPushTransfer && !canConfirmReceipt) return null;
        const invoke = async (action: 'push_transfer' | 'confirm_receipt') => {
          setActing(true);
          try {
            const { error } = await supabase.functions.invoke('order-progress', { body: { action, order_id: orderId } });
            if (error) throw error;
            toast.success(action === 'push_transfer' ? '已标记为过户完成' : '已确认收货，款项将结算给卖家');
            load();
          } catch (e: any) {
            toast.error(e.message || '操作失败');
          } finally {
            setActing(false);
          }
        };
        return (
          <div className="mt-5 pt-5 border-t flex flex-wrap gap-2">
            {canPushTransfer && (
              <Button size="sm" onClick={() => invoke('push_transfer')} disabled={acting}>
                <PackageCheck className="w-3.5 h-3.5 mr-1.5" /> 标记为过户完成
              </Button>
            )}
            {canConfirmReceipt && (
              <Button size="sm" onClick={() => invoke('confirm_receipt')} disabled={acting}>
                <Handshake className="w-3.5 h-3.5 mr-1.5" /> 确认收货并结算
              </Button>
            )}
          </div>
        );
      })()}
    </div>
  );
}

export default OrderProgressTracker;

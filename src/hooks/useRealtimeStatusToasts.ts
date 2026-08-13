import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * 用户中心实时提醒：报价 / 订单状态变化时弹出站内提示，并可跳转查看详情。
 * 邮件提醒由 notify-status-change 边缘函数按用户通知偏好发送。
 */
export const useRealtimeStatusToasts = (enabled = true) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || !user) return;

    const channel = supabase
      .channel('usercenter-live-alerts-' + user.id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const n = payload.new as any;
        if (!n?.id || seen.current.has(n.id)) return;
        seen.current.add(n.id);
        toast(n.title, {
          description: n.message,
          action: n.action_url
            ? { label: '查看详情', onClick: () => navigate(n.action_url) }
            : undefined,
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [enabled, user, navigate]);
};

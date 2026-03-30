import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { Notification } from '@/types/domain';
import { toast } from 'sonner';
import { useRealtimeSubscription } from './useRealtimeSubscription';

const NOTIF_KEY = (userId: string) => ['notifications', userId] as const;

const fetchNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_user_notifications', { user_id_param: userId });
    if (error) throw error;
    return (data ?? []) as unknown as Notification[];
  } catch {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    return (data ?? []) as unknown as Notification[];
  }
};

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const handlerRef = useRef<((n: Notification) => void) | null>(null);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: user ? NOTIF_KEY(user.id) : ['notifications', 'none'],
    queryFn: () => (user ? fetchNotifications(user.id) : Promise.resolve([])),
    enabled: !!user,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const unreadCount = (notifications as Notification[]).filter(n => !n.is_read).length;

  // Keep handler ref stable
  useEffect(() => {
    if (!user) return;
    handlerRef.current = (newNotif: Notification) => {
      queryClient.setQueryData(
        NOTIF_KEY(user.id),
        (old: Notification[] = []) => [newNotif, ...old]
      );
      toast.info(newNotif.title, {
        description: newNotif.message,
        action: newNotif.action_url
          ? { label: '查看', onClick: () => { window.location.href = newNotif.action_url || '#'; } }
          : undefined,
      });
    };
  }, [user?.id, queryClient]);

  // Real-time subscription via SSE
  useRealtimeSubscription(
    ['notifications'],
    (event) => {
      if (!user || event.type !== 'db-change') return;
      if (event.eventType !== 'INSERT') return;
      const row = event.new as Notification | undefined;
      if (!row || row.user_id !== user.id) return;
      handlerRef.current?.(row);
    },
    !!user
  );

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    queryClient.setQueryData(NOTIF_KEY(user.id), (old: Notification[] = []) =>
      old.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    try {
      const { error } = await supabase.rpc('mark_notification_as_read', {
        notification_id_param: notificationId,
      });
      if (error) throw error;
    } catch {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    queryClient.setQueryData(NOTIF_KEY(user.id), (old: Notification[] = []) =>
      old.map(n => ({ ...n, is_read: true }))
    );
    try {
      const { error } = await supabase.rpc('mark_all_notifications_as_read', {
        user_id_param: user.id,
      });
      if (error) throw error;
    } catch {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
    }
    toast.success('已将所有通知标记为已读');
  };

  const refreshNotifications = () => {
    if (user) queryClient.invalidateQueries({ queryKey: NOTIF_KEY(user.id) });
  };

  return {
    notifications: notifications as Notification[],
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  };
};

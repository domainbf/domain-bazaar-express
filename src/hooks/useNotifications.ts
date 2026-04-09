import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Notification } from '@/types/domain';
import { toast } from 'sonner';

const NOTIF_KEY = (userId: string) => ['notifications', userId] as const;

const fetchNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []) as Notification[];
  } catch {
    return [];
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

  // Realtime subscription via Supabase channels
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        handlerRef.current?.(payload.new as Notification);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    queryClient.setQueryData(NOTIF_KEY(user.id), (old: Notification[] = []) =>
      old.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    try {
      await supabase.rpc('mark_notification_as_read', { notification_id_param: notificationId });
    } catch (e) {
      console.warn('markAsRead failed:', e);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    queryClient.setQueryData(NOTIF_KEY(user.id), (old: Notification[] = []) =>
      old.map(n => ({ ...n, is_read: true }))
    );
    try {
      await supabase.rpc('mark_all_notifications_as_read', { user_id_param: user.id });
    } catch (e) {
      console.warn('markAllAsRead failed:', e);
    }
    toast.success('已将所有通知标记为已读');
  };

  const refreshNotifications = useCallback(() => {
    if (user) queryClient.invalidateQueries({ queryKey: NOTIF_KEY(user.id) });
  }, [user?.id, queryClient]);

  return {
    notifications: notifications as Notification[],
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  };
};

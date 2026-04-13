import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Notification } from '@/types/domain';
import { toast } from 'sonner';

const NOTIF_KEY = (userId: string) => ['notifications', userId] as const;

let notificationsChannel: ReturnType<typeof supabase.channel> | null = null;
let notificationsChannelUserId: string | null = null;
let notificationsChannelNonce = 0;
let notificationsSubscriberCount = 0;
let notificationsQueryClient: QueryClient | null = null;

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

const mergeNotification = (items: Notification[], next: Notification) => {
  const existingIndex = items.findIndex((item) => item.id === next.id);

  if (existingIndex >= 0) {
    const merged = [...items];
    merged[existingIndex] = { ...merged[existingIndex], ...next };
    return merged;
  }

  return [next, ...items].slice(0, 50);
};

const pushRealtimeNotification = (userId: string, notification: Notification) => {
  if (!notificationsQueryClient) return;

  notificationsQueryClient.setQueryData(
    NOTIF_KEY(userId),
    (old: Notification[] = []) => mergeNotification(old, notification)
  );

  toast.info(notification.title, {
    description: notification.message,
    action: notification.action_url
      ? {
          label: '查看',
          onClick: () => {
            window.location.href = notification.action_url || '#';
          },
        }
      : undefined,
  });
};

const ensureNotificationsSubscription = (userId: string, queryClient: QueryClient) => {
  notificationsQueryClient = queryClient;

  if (notificationsChannel && notificationsChannelUserId === userId) {
    return;
  }

  if (notificationsChannel) {
    void supabase.removeChannel(notificationsChannel);
    notificationsChannel = null;
  }

  notificationsChannelNonce += 1;

  const channel = supabase
    .channel(`notifications-${userId}-${notificationsChannelNonce}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        pushRealtimeNotification(userId, payload.new as Notification);
      }
    );

  channel.subscribe();

  notificationsChannel = channel;
  notificationsChannelUserId = userId;
};

const releaseNotificationsSubscription = () => {
  notificationsSubscriberCount = Math.max(0, notificationsSubscriberCount - 1);

  if (notificationsSubscriberCount === 0 && notificationsChannel) {
    void supabase.removeChannel(notificationsChannel);
    notificationsChannel = null;
    notificationsChannelUserId = null;
    notificationsQueryClient = null;
  }
};

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: userId ? NOTIF_KEY(userId) : ['notifications', 'none'],
    queryFn: () => (userId ? fetchNotifications(userId) : Promise.resolve([])),
    enabled: !!userId,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const unreadCount = (notifications as Notification[]).filter(n => !n.is_read).length;

  useEffect(() => {
    if (!userId) return;

    notificationsSubscriberCount += 1;
    ensureNotificationsSubscription(userId, queryClient);

    return () => {
      releaseNotificationsSubscription();
    };
  }, [userId, queryClient]);

  const markAsRead = async (notificationId: string) => {
    if (!userId) return;
    queryClient.setQueryData(NOTIF_KEY(userId), (old: Notification[] = []) =>
      old.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    try {
      await supabase.rpc('mark_notification_as_read', { notification_id_param: notificationId });
    } catch (e) {
      console.warn('markAsRead failed:', e);
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    queryClient.setQueryData(NOTIF_KEY(userId), (old: Notification[] = []) =>
      old.map(n => ({ ...n, is_read: true }))
    );
    try {
      await supabase.rpc('mark_all_notifications_as_read', { user_id_param: userId });
    } catch (e) {
      console.warn('markAllAsRead failed:', e);
    }
    toast.success('已将所有通知标记为已读');
  };

  const refreshNotifications = useCallback(() => {
    if (userId) queryClient.invalidateQueries({ queryKey: NOTIF_KEY(userId) });
  }, [userId, queryClient]);

  return {
    notifications: notifications as Notification[],
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  };
};

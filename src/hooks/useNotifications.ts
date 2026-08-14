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

// 去重：同一用户在 2 分钟内产生的「同标题+同内容+同类型」通知视为重复，仅保留最新一条
const DEDUPE_WINDOW_MS = 2 * 60 * 1000;

const dedupeKey = (n: Notification) =>
  `${n.type || ''}|${n.title || ''}|${n.message || ''}|${(n as any).related_id || ''}`;

const dedupeNotifications = (items: Notification[]): Notification[] => {
  const kept: Notification[] = [];
  const lastSeen = new Map<string, number>();
  for (const n of items) {
    const key = dedupeKey(n);
    const ts = new Date(n.created_at as any).getTime() || 0;
    const prev = lastSeen.get(key);
    if (prev !== undefined && Math.abs(prev - ts) < DEDUPE_WINDOW_MS) continue;
    lastSeen.set(key, ts);
    kept.push(n);
  }
  return kept;
};

const fetchNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return dedupeNotifications((data ?? []) as Notification[]);
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

  // 内容级去重：短时间内重复推送同一条通知时不再重复插入
  const key = dedupeKey(next);
  const ts = new Date(next.created_at as any).getTime() || Date.now();
  const duplicate = items.find(
    (item) =>
      dedupeKey(item) === key &&
      Math.abs((new Date(item.created_at as any).getTime() || 0) - ts) < DEDUPE_WINDOW_MS
  );
  if (duplicate) return items;

  return [next, ...items].slice(0, 50);
};

const isDuplicatePush = (userId: string, notification: Notification) => {
  const cache = notificationsQueryClient?.getQueryData<Notification[]>(NOTIF_KEY(userId)) ?? [];
  const key = dedupeKey(notification);
  const ts = new Date(notification.created_at as any).getTime() || Date.now();
  return cache.some(
    (item) =>
      item.id !== notification.id &&
      dedupeKey(item) === key &&
      Math.abs((new Date(item.created_at as any).getTime() || 0) - ts) < DEDUPE_WINDOW_MS
  );
};

const pushRealtimeNotification = (userId: string, notification: Notification) => {
  if (!notificationsQueryClient) return;

  const duplicate = isDuplicatePush(userId, notification);

  notificationsQueryClient.setQueryData(
    NOTIF_KEY(userId),
    (old: Notification[] = []) => mergeNotification(old, notification)
  );

  if (duplicate) return;

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

const applyRealtimeUpdate = (userId: string, notification: Notification) => {
  notificationsQueryClient?.setQueryData(NOTIF_KEY(userId), (old: Notification[] = []) =>
    old.map((n) => (n.id === notification.id ? { ...n, ...notification } : n))
  );
};

const applyRealtimeDelete = (userId: string, id: string) => {
  notificationsQueryClient?.setQueryData(NOTIF_KEY(userId), (old: Notification[] = []) =>
    old.filter((n) => n.id !== id)
  );
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

  const filter = `user_id=eq.${userId}`;

  const channel = supabase
    .channel(`notifications-${userId}-${notificationsChannelNonce}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter },
      (payload) => {
        pushRealtimeNotification(userId, payload.new as Notification);
      }
    )
    // 已读状态在其他设备变更时，未读数量实时同步
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'notifications', filter },
      (payload) => {
        applyRealtimeUpdate(userId, payload.new as Notification);
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'notifications' },
      (payload) => {
        const id = (payload.old as any)?.id;
        if (id) applyRealtimeDelete(userId, id);
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

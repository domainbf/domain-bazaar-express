import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { apiGet, apiPatch, apiPost } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { Notification } from '@/types/domain';
import { toast } from 'sonner';
import { useRealtimeSubscription } from './useRealtimeSubscription';

const NOTIF_KEY = (userId: string) => ['notifications', userId] as const;

const fetchNotifications = async (): Promise<Notification[]> => {
  try {
    const data = await apiGet<Notification[]>('/data/notifications');
    return data ?? [];
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
    queryFn: () => (user ? fetchNotifications() : Promise.resolve([])),
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
      const row = event.new as unknown as Notification | undefined;
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
      await apiPatch(`/data/notifications/${notificationId}/read`, {});
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
      await apiPost('/data/notifications/read-all', {});
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

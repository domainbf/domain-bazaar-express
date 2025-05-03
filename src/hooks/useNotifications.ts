
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { Notification } from '@/types/domain';
import { toast } from 'sonner';

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Using RPC function to get user notifications
      const { data, error } = await supabase
        .rpc('get_user_notifications', { user_id_param: user.id });

      if (error) throw error;

      // Convert to notification type and set state
      const typedNotifications = data as unknown as Notification[];
      setNotifications(typedNotifications);
      
      // Calculate unread count
      const unread = typedNotifications.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error: any) {
      console.error('Error loading notifications:', error);
      toast.error('加载通知失败');
      
      // Fallback: use direct table query
      try {
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);
          
        if (data) {
          const typedNotifications = data as unknown as Notification[];
          setNotifications(typedNotifications);
          const unread = typedNotifications.filter(n => !n.is_read).length;
          setUnreadCount(unread);
        }
      } catch (fallbackError) {
        console.error('Error in fallback notifications query:', fallbackError);
        setNotifications([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      // Use RPC function to mark as read
      const { error } = await supabase
        .rpc('mark_notification_as_read', { 
          notification_id_param: notificationId 
        });

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      
      // Recalculate unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      toast.error('更新通知状态失败');
      
      // Fallback: direct update
      try {
        const { error: fallbackError } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notificationId);
          
        if (!fallbackError) {
          setNotifications(prev => 
            prev.map(n => 
              n.id === notificationId ? { ...n, is_read: true } : n
            )
          );
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } catch (fallbackError) {
        console.error('Error in fallback update:', fallbackError);
      }
    }
  };

  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return;

    try {
      // Use RPC function to mark all as read
      const { error } = await supabase
        .rpc('mark_all_notifications_as_read', { 
          user_id_param: user.id 
        });

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
      toast.success('已将所有通知标记为已读');
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      toast.error('更新通知状态失败');
      
      // Fallback: direct update
      try {
        const { error: fallbackError } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', user.id)
          .eq('is_read', false);
          
        if (!fallbackError) {
          setNotifications(prev => 
            prev.map(n => ({ ...n, is_read: true }))
          );
          setUnreadCount(0);
          toast.success('已将所有通知标记为已读');
        }
      } catch (fallbackError) {
        console.error('Error in fallback batch update:', fallbackError);
      }
    }
  };

  // Load notifications when user changes
  useEffect(() => {
    loadNotifications();
  }, [user, loadNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refreshNotifications: loadNotifications
  };
};

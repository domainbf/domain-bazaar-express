
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
      // 执行原始SQL查询来获取通知
      // 由于notifications表不在Supabase类型定义中，使用原始SQL查询
      const { data, error } = await supabase
        .rpc('get_user_notifications', { user_id_param: user.id })
        .select()
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // 转换为通知类型并设置状态
      const typedNotifications = data as unknown as Notification[];
      setNotifications(typedNotifications);
      
      // 计算未读数量
      const unread = typedNotifications.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error: any) {
      console.error('Error loading notifications:', error);
      toast.error('加载通知失败');
      
      // 错误回退：使用自定义查询
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
      // 使用原始SQL更新
      const { error } = await supabase
        .rpc('mark_notification_as_read', { 
          notification_id_param: notificationId 
        });

      if (error) throw error;

      // 更新本地状态
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      
      // 重新计算未读数量
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      toast.error('更新通知状态失败');
      
      // 回退：直接更新通知表
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
      // 使用原始SQL标记所有为已读
      const { error } = await supabase
        .rpc('mark_all_notifications_as_read', { 
          user_id_param: user.id 
        });

      if (error) throw error;

      // 更新本地状态
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      
      // 重置未读计数
      setUnreadCount(0);
      toast.success('已将所有通知标记为已读');
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      toast.error('更新通知状态失败');
      
      // 回退：直接更新通知表
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

  // 当用户变化时加载通知
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

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export const useUnreadMessages = () => {
  const { user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);

  const refreshUnread = async () => {
    if (!user) { setUnreadMessages(0); return; }
    try {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);
      setUnreadMessages(count ?? 0);
    } catch {
      // messages table may not exist yet
    }
  };

  useEffect(() => {
    if (!user) return;
    refreshUnread();
  }, [user?.id]);

  useRealtimeSubscription(
    ['messages'],
    (event) => {
      if (!user || event.type !== 'db-change') return;
      const row = event.new as Record<string, unknown> | undefined;
      if (row?.receiver_id === user.id) refreshUnread();
    },
    !!user
  );

  return { unreadMessages, refreshUnread };
};

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
      // messages table may not exist yet if migration hasn't been run
    }
  };

  useEffect(() => {
    if (!user) return;
    refreshUnread();

    const channel = supabase
      .channel('unread-messages-count')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, () => { refreshUnread(); })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, () => { refreshUnread(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  return { unreadMessages, refreshUnread };
};

import { useNotifications } from '@/hooks/useNotifications';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useIsMobile } from '@/hooks/use-mobile';
import { BottomNavigation } from './BottomNavigation';

export const GlobalBottomNav = () => {
  const isMobile = useIsMobile();
  const { unreadCount } = useNotifications();
  const { unreadMessages } = useUnreadMessages();

  if (!isMobile) return null;

  return <BottomNavigation unreadCount={unreadCount} unreadMessages={unreadMessages} />;
};

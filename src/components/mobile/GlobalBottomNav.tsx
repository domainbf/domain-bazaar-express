import { useNotifications } from '@/hooks/useNotifications';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocation } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';

// Paths where the bottom nav should be hidden (admin has its own nav system)
const HIDDEN_PATHS = ['/admin'];

export const GlobalBottomNav = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { unreadCount } = useNotifications();
  const { unreadMessages } = useUnreadMessages();

  if (!isMobile) return null;

  // Hide on admin and any sub-paths of admin
  if (HIDDEN_PATHS.some(p => location.pathname === p || location.pathname.startsWith(p + '/'))) {
    return null;
  }

  return <BottomNavigation unreadCount={unreadCount} unreadMessages={unreadMessages} />;
};

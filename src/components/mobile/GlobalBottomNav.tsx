import { useNotifications } from '@/hooks/useNotifications';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BottomNavigation } from './BottomNavigation';

const HIDDEN_PATHS = ['/admin'];

export const GlobalBottomNav = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { unreadMessages } = useUnreadMessages();

  if (!isMobile) return null;
  if (!user) return null;

  if (HIDDEN_PATHS.some(p => location.pathname === p || location.pathname.startsWith(p + '/'))) {
    return null;
  }

  return <BottomNavigation unreadCount={unreadCount} unreadMessages={unreadMessages} />;
};

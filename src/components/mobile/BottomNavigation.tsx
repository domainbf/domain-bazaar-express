import { Home, Search, User, Bell, MessageSquare } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface BottomNavigationProps {
  unreadCount?: number;
  unreadMessages?: number;
}

export const BottomNavigation = ({ unreadCount = 0, unreadMessages = 0 }: BottomNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const navItems = [
    { 
      id: 'home', 
      label: '首页', 
      icon: Home, 
      path: '/',
      tab: null,
      authRequired: false 
    },
    { 
      id: 'marketplace', 
      label: '市场', 
      icon: Search, 
      path: '/marketplace',
      tab: null,
      authRequired: false 
    },
    { 
      id: 'messages', 
      label: '消息', 
      icon: MessageSquare, 
      path: '/user-center',
      tab: 'messages',
      authRequired: true,
      showMessageBadge: true
    },
    { 
      id: 'notifications', 
      label: '通知', 
      icon: Bell, 
      path: '/user-center',
      tab: 'notifications',
      authRequired: true,
      showBadge: true
    },
    { 
      id: 'profile', 
      label: '我的', 
      icon: User, 
      path: '/user-center',
      tab: 'profile',
      authRequired: false 
    },
  ];

  const isActive = (item: typeof navItems[0]) => {
    const currentTab = searchParams.get('tab');
    
    if (item.path === '/' && location.pathname === '/') return true;
    if (item.path === '/marketplace' && location.pathname === '/marketplace') return true;
    
    if (item.path === '/user-center' && location.pathname === '/user-center') {
      if (item.tab === currentTab) return true;
    }
    
    return false;
  };

  const handleNavigation = (item: typeof navItems[0]) => {
    if (item.authRequired && !user) {
      navigate('/auth');
      return;
    }
    
    if (item.path === '/user-center' && !user) {
      navigate('/auth');
      return;
    }
    
    if (item.tab) {
      if (location.pathname === '/user-center') {
        window.history.replaceState({}, '', `/user-center?tab=${item.tab}`);
        window.dispatchEvent(new CustomEvent('tabChange', { detail: { tab: item.tab } }));
      } else {
        navigate(`${item.path}?tab=${item.tab}`);
      }
    } else {
      navigate(item.path);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 safe-area-inset-bottom md:hidden">
      <nav className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          const badge = item.showBadge ? unreadCount : item.showMessageBadge ? unreadMessages : 0;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              data-testid={`nav-${item.id}`}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={`w-6 h-6 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-[16px] flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-medium rounded-full px-1">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>
              <span className={`text-xs mt-1 ${active ? 'font-semibold' : 'font-normal'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

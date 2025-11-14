import { Home, Search, User, Bell } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

interface BottomNavigationProps {
  unreadCount?: number;
}

export const BottomNavigation = ({ unreadCount = 0 }: BottomNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { 
      id: 'home', 
      label: '首页', 
      icon: Home, 
      path: '/',
      authRequired: false 
    },
    { 
      id: 'marketplace', 
      label: '市场', 
      icon: Search, 
      path: '/marketplace',
      authRequired: false 
    },
    { 
      id: 'notifications', 
      label: '通知', 
      icon: Bell, 
      path: '/user-center?tab=notifications',
      authRequired: true,
      badge: unreadCount 
    },
    { 
      id: 'profile', 
      label: '我的', 
      icon: User, 
      path: user ? '/user-center' : '/auth',
      authRequired: false 
    },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path.split('?')[0]);
  };

  const handleNavigation = (item: typeof navItems[0]) => {
    if (item.authRequired && !user) {
      navigate('/auth');
      return;
    }
    navigate(item.path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom md:hidden">
      <nav className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
                active ? 'text-primary' : 'text-gray-500'
              }`}
            >
              <div className="relative">
                <Icon className={`w-6 h-6 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {item.badge && item.badge > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 min-w-[20px] flex items-center justify-center px-1 text-xs"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
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

import { Home, Search, User, Bell } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
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
    const searchParams = new URLSearchParams(location.search);
    const currentTab = searchParams.get('tab');
    
    // 对于首页
    if (item.path === '/' && location.pathname === '/') return true;
    
    // 对于市场
    if (item.path === '/marketplace' && location.pathname === '/marketplace') return true;
    
    // 对于用户中心的标签页
    if (item.path === '/user-center' && location.pathname === '/user-center') {
      if (item.tab === 'notifications' && currentTab === 'notifications') return true;
      if (item.tab === 'profile' && (currentTab === 'profile' || (!currentTab && item.id === 'profile'))) return true;
      // 默认在用户中心时，我的按钮不激活，除非明确是 profile tab
      if (item.tab === 'profile' && !currentTab) return false;
    }
    
    return false;
  };

  const handleNavigation = (item: typeof navItems[0]) => {
    // 如果需要登录但未登录
    if (item.authRequired && !user) {
      navigate('/auth');
      return;
    }
    
    // 对于用户中心的页面，未登录时跳转到登录
    if (item.path === '/user-center' && !user) {
      navigate('/auth');
      return;
    }
    
    // 如果有 tab 参数，导航到对应标签
    if (item.tab) {
      navigate(`${item.path}?tab=${item.tab}`);
    } else {
      navigate(item.path);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom md:hidden">
      <nav className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
                active ? 'text-primary' : 'text-gray-500'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={`w-6 h-6 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {item.showBadge && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-[16px] flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-medium rounded-full px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
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

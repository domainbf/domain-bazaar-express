import { useRef, useState, useEffect } from 'react';
import { Home, Search, Globe, MessageSquare, User } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface BottomNavigationProps {
  unreadCount?: number;
  unreadMessages?: number;
}

export const BottomNavigation = ({ unreadCount = 0, unreadMessages = 0 }: BottomNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);
  const ticking = useRef(false);

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastY.current;
        if (delta > 6 && currentY > 60) {
          setVisible(false);
        } else if (delta < -6) {
          setVisible(true);
        }
        lastY.current = currentY;
        ticking.current = false;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Always show when route / tab changes
  useEffect(() => {
    setVisible(true);
    lastY.current = window.scrollY;
  }, [location.pathname, searchParams.toString()]);

  const navItems = [
    {
      id: 'home',
      label: '首页',
      icon: Home,
      path: '/',
      tab: null,
      authRequired: false,
    },
    {
      id: 'marketplace',
      label: '市场',
      icon: Search,
      path: '/marketplace',
      tab: null,
      authRequired: false,
    },
    {
      id: 'domains',
      label: '域名',
      icon: Globe,
      path: '/user-center',
      tab: 'domains',
      authRequired: true,
    },
    {
      id: 'messages',
      label: '消息',
      icon: MessageSquare,
      path: '/user-center',
      tab: 'messages',
      authRequired: true,
      badge: unreadMessages,
    },
    {
      id: 'profile',
      label: '我的',
      icon: User,
      path: '/user-center',
      tab: 'profile',
      authRequired: false,
      badge: unreadCount,
    },
  ];

  const isActive = (item: typeof navItems[0]) => {
    const currentTab = searchParams.get('tab');
    if (item.path === '/' && location.pathname === '/') return true;
    if (item.path === '/marketplace' && location.pathname === '/marketplace') return true;
    if (item.path === '/user-center' && location.pathname === '/user-center') {
      if (item.tab === currentTab) return true;
      if (!currentTab && item.tab === 'domains') return true;
    }
    return false;
  };

  const handleNavigation = (item: typeof navItems[0]) => {
    if ((item.authRequired || item.path === '/user-center') && !user) {
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

  const navHeight = 56;
  const safeArea = 'env(safe-area-inset-bottom, 0px)';

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-50 md:hidden"
      style={{ paddingBottom: safeArea }}
      animate={{ y: visible ? 0 : navHeight + 34 }}
      transition={{ type: 'tween', duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
    >
      <nav className="flex justify-around items-stretch h-[56px]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          const badge = item.badge ?? 0;

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              data-testid={`nav-${item.id}`}
              className="relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors"
            >
              {/* Active top-line indicator */}
              <AnimatePresence>
                {active && (
                  <motion.div
                    layoutId="bottom-nav-pill"
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-foreground"
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    exit={{ opacity: 0, scaleX: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
              </AnimatePresence>

              <div className="relative">
                <Icon
                  className={`w-[22px] h-[22px] transition-all duration-200 ${
                    active
                      ? 'text-foreground stroke-[2.5]'
                      : 'text-muted-foreground stroke-[1.8]'
                  }`}
                />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 h-[16px] min-w-[16px] flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full px-1 leading-none">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>

              <span className={`text-[10px] leading-none transition-colors duration-200 ${
                active ? 'text-foreground font-semibold' : 'text-muted-foreground'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </motion.div>
  );
};

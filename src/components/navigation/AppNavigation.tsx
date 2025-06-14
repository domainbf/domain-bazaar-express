
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, 
  Search, 
  User, 
  Settings, 
  BarChart3,
  DollarSign,
  Shield,
  Globe,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

interface AppNavigationProps {
  currentPath?: string;
  className?: string;
}

export const AppNavigation: React.FC<AppNavigationProps> = ({ 
  currentPath = '/',
  className 
}) => {
  const navigationItems: NavigationItem[] = [
    {
      href: '/',
      label: '首页',
      icon: <Home className="h-4 w-4" />,
      description: '返回主页'
    },
    {
      href: '/marketplace',
      label: '域名市场',
      icon: <Search className="h-4 w-4" />,
      description: '浏览所有可购买域名'
    },
    {
      href: '/user-center',
      label: '用户中心',
      icon: <User className="h-4 w-4" />,
      description: '管理您的域名和交易'
    },
    {
      href: '/admin',
      label: '管理面板',
      icon: <Settings className="h-4 w-4" />,
      description: '系统管理'
    }
  ];

  const quickActions = [
    {
      href: '/marketplace?search=premium',
      label: '精品域名',
      icon: <Star className="h-4 w-4" />
    },
    {
      href: '/user-center?tab=domains',
      label: '我的域名',
      icon: <Globe className="h-4 w-4" />
    },
    {
      href: '/user-center?tab=transactions',
      label: '交易记录',
      icon: <DollarSign className="h-4 w-4" />
    },
    {
      href: '/domain-verification',
      label: '域名验证',
      icon: <Shield className="h-4 w-4" />
    }
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* 主导航 */}
      <div>
        <h3 className="text-lg font-semibold mb-3">主要功能</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 p-4 rounded-lg border transition-colors",
                "hover:bg-muted/50 hover:border-primary/50",
                currentPath === item.href && "bg-primary/5 border-primary"
              )}
            >
              {item.icon}
              <div>
                <div className="font-medium">{item.label}</div>
                {item.description && (
                  <div className="text-sm text-muted-foreground">
                    {item.description}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 快速操作 */}
      <div>
        <h3 className="text-lg font-semibold mb-3">快速操作</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              to={action.href}
              className="flex flex-col items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 hover:border-primary/50 transition-colors text-center"
            >
              {action.icon}
              <span className="text-sm font-medium">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* 统计信息快捷方式 */}
      <div>
        <h3 className="text-lg font-semibold mb-3">数据分析</h3>
        <div className="flex gap-2">
          <Link
            to="/user-center?tab=analytics"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="text-sm">用户行为分析</span>
          </Link>
          <Link
            to="/user-center?tab=transactions"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">交易统计</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

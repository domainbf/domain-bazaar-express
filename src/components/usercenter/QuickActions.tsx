import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus, 
  Search, 
  ShoppingCart, 
  TrendingUp, 
  Shield, 
  Bell,
  HelpCircle,
  Settings,
  BarChart3,
  Calculator
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from "@/components/ui/badge";
import { useNotifications } from '@/hooks/useNotifications';

interface QuickActionsProps {
  onAddDomain?: () => void;
  onViewNotifications?: () => void;
}

export const QuickActions = ({ onAddDomain, onViewNotifications }: QuickActionsProps) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { unreadCount } = useNotifications();

  const quickActions = [
    {
      icon: Plus,
      label: '添加域名',
      description: '上架新域名出售',
      onClick: onAddDomain,
      color: 'bg-blue-500 hover:bg-blue-600',
      showFor: 'seller'
    },
    {
      icon: Search,
      label: '浏览市场',
      description: '发现优质域名',
      onClick: () => navigate('/marketplace'),
      color: 'bg-green-500 hover:bg-green-600',
      showFor: 'all'
    },
    {
      icon: Calculator,
      label: '域名估价',
      description: 'AI智能估价工具',
      onClick: () => navigate('/#estimator'),
      color: 'bg-purple-500 hover:bg-purple-600',
      showFor: 'all'
    },
    {
      icon: BarChart3,
      label: '数据分析',
      description: '查看域名表现',
      onClick: () => navigate('/user-center?tab=domains'),
      color: 'bg-orange-500 hover:bg-orange-600',
      showFor: 'seller'
    },
    {
      icon: Bell,
      label: '消息通知',
      description: `${unreadCount > 0 ? `${unreadCount}条未读` : '查看所有通知'}`,
      onClick: onViewNotifications || (() => navigate('/user-center?tab=notifications')),
      color: 'bg-red-500 hover:bg-red-600',
      badge: unreadCount > 0 ? unreadCount : undefined,
      showFor: 'all'
    },
    {
      icon: Shield,
      label: '安全中心',
      description: '账户安全设置',
      onClick: () => navigate('/security-center'),
      color: 'bg-gray-700 hover:bg-gray-800',
      showFor: 'all'
    },
    {
      icon: HelpCircle,
      label: '帮助中心',
      description: '常见问题解答',
      onClick: () => navigate('/faq'),
      color: 'bg-teal-500 hover:bg-teal-600',
      showFor: 'all'
    },
    {
      icon: Settings,
      label: '账户设置',
      description: '管理个人资料',
      onClick: () => navigate('/user-center?tab=profile'),
      color: 'bg-indigo-500 hover:bg-indigo-600',
      showFor: 'all'
    }
  ];

  const filteredActions = quickActions.filter(action => {
    if (action.showFor === 'all') return true;
    if (action.showFor === 'seller' && profile?.is_seller) return true;
    return false;
  });

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">快捷操作</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {filteredActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant="ghost"
                className="flex flex-col items-center justify-center h-auto py-3 px-2 hover:bg-gray-100 relative"
                onClick={action.onClick}
              >
                <div className={`w-10 h-10 rounded-full ${action.color} text-white flex items-center justify-center mb-2`}>
                  <Icon className="h-5 w-5" />
                  {action.badge && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center text-xs"
                    >
                      {action.badge > 99 ? '99+' : action.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-xs font-medium text-center">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

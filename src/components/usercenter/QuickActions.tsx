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
      onClick: onAddDomain,
      color: 'bg-primary text-primary-foreground',
      showFor: 'seller'
    },
    {
      icon: Search,
      label: '浏览市场',
      onClick: () => navigate('/marketplace'),
      color: 'bg-green-600 text-white',
      showFor: 'all'
    },
    {
      icon: Calculator,
      label: '域名估价',
      onClick: () => navigate('/#estimator'),
      color: 'bg-purple-600 text-white',
      showFor: 'all'
    },
    {
      icon: BarChart3,
      label: '数据分析',
      onClick: () => navigate('/user-center?tab=domains'),
      color: 'bg-orange-600 text-white',
      showFor: 'seller'
    },
    {
      icon: Bell,
      label: '消息通知',
      onClick: onViewNotifications || (() => navigate('/user-center?tab=notifications')),
      color: 'bg-red-600 text-white',
      badge: unreadCount > 0 ? unreadCount : undefined,
      showFor: 'all'
    },
    {
      icon: Shield,
      label: '安全中心',
      onClick: () => navigate('/security-center'),
      color: 'bg-foreground text-background',
      showFor: 'all'
    },
    {
      icon: HelpCircle,
      label: '帮助中心',
      onClick: () => navigate('/faq'),
      color: 'bg-teal-600 text-white',
      showFor: 'all'
    },
    {
      icon: Settings,
      label: '账户设置',
      onClick: () => navigate('/user-center?tab=profile'),
      color: 'bg-indigo-600 text-white',
      showFor: 'all'
    }
  ];

  const filteredActions = quickActions.filter(action => {
    if (action.showFor === 'all') return true;
    if (action.showFor === 'seller' && profile?.is_seller) return true;
    return false;
  });

  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">快捷操作</h3>
        <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {filteredActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                className="flex flex-col items-center justify-center gap-2 py-3 px-1 rounded-xl hover:bg-muted/60 transition-colors relative group"
                onClick={action.onClick}
              >
                <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                  <Icon className="h-5 w-5" />
                  {action.badge && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 right-0 h-4 min-w-4 flex items-center justify-center text-[10px] p-0 px-1"
                    >
                      {action.badge > 99 ? '99+' : action.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-xs font-medium text-foreground/80">{action.label}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

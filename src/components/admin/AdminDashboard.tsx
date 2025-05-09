
import { AdminStats } from '@/types/domain';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users, Link, ShoppingBag, MessageSquare, CreditCard, ExternalLink, Shield, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface AdminDashboardProps {
  stats: AdminStats;
  isLoading: boolean;
  onRefresh: () => Promise<void>;
}

export const AdminDashboard = ({ stats, isLoading, onRefresh }: AdminDashboardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleVerifyPendingDomains = () => {
    navigate('/admin?tab=verifications');
  };

  const handleManageListings = () => {
    navigate('/admin?tab=domains');
  };

  const handleManageSiteSettings = () => {
    navigate('/admin?tab=settings');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{t('admin.dashboard.overview', '仪表盘概览')}</h2>
        <Button size="sm" variant="outline" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {t('common.refresh', '刷新')}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.dashboard.totalDomains', '总域名数')}</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_domains}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {t('admin.dashboard.domainsDescription', '系统中注册的所有域名总数')}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.dashboard.pendingVerifications', '待验证域名')}</CardTitle>
            <Link className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_verifications}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {t('admin.dashboard.verificationsDescription', '等待管理员批准的域名验证请求')}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.dashboard.activeListings', '活跃列表')}</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_listings}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {t('admin.dashboard.listingsDescription', '当前可用于购买的域名数量')}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.dashboard.totalOffers', '总报价数')}</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_offers}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {t('admin.dashboard.offersDescription', '系统中所有域名的累计报价数量')}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.dashboard.recentTransactions', '近期交易')}</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recent_transactions}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {t('admin.dashboard.transactionsDescription', '过去30天内完成的域名交易')}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('admin.dashboard.quickActions', '快捷操作')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleVerifyPendingDomains}
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              {t('admin.dashboard.verifyPendingDomains', '验证待处理域名')}
              {stats.pending_verifications > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {stats.pending_verifications}
                </span>
              )}
            </Button>
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleManageListings}
              className="flex items-center gap-2"
            >
              <ShoppingBag className="h-4 w-4" />
              {t('admin.dashboard.manageDomainListings', '管理域名列表')}
            </Button>
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleManageSiteSettings}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              {t('admin.dashboard.siteSettings', '网站设置')}
            </Button>
            
            <Button 
              size="sm" 
              variant="outline"
              className="flex items-center gap-2"
              asChild
            >
              <a href="/marketplace" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                {t('admin.dashboard.viewMarketplace', '查看市场')}
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

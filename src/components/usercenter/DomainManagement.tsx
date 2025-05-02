
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { DomainActions } from './DomainActions';
import { Eye, ExternalLink, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface Domain {
  id: string;
  name: string;
  price: number;
  category?: string;
  description?: string;
  status?: string;
  is_verified?: boolean;
  created_at?: string;
  views?: number;
  domain_analytics?: {views?: number}[];
}

export const DomainManagement = () => {
  const { user } = useAuth();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const loadDomains = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      // 优化查询，分别获取domains和analytics
      const { data: domainsData, error: domainsError } = await supabase
        .from('domain_listings')
        .select('*')
        .eq('owner_id', user.id);
      
      if (domainsError) throw domainsError;
      
      if (!domainsData || domainsData.length === 0) {
        setDomains([]);
        setIsLoading(false);
        return;
      }
      
      // 获取这些域名的analytics数据
      const domainIds = domainsData.map(domain => domain.id);
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('domain_analytics')
        .select('*')
        .in('domain_id', domainIds);
      
      if (analyticsError) {
        console.error('Error fetching analytics:', analyticsError);
        // 继续处理，即使analytics获取失败
      }
      
      // 合并数据
      const domainsWithAnalytics = domainsData.map(domain => {
        const analytics = analyticsData?.filter(a => a.domain_id === domain.id) || [];
        const viewsValue = analytics.length > 0 ? Number(analytics[0].views || 0) : 0;
        
        return {
          ...domain,
          views: viewsValue,
          domain_analytics: analytics.map(a => ({
            views: Number(a.views || 0),
            id: a.id
          }))
        };
      });
      
      console.log('Fetched user domains:', domainsWithAnalytics);
      setDomains(domainsWithAnalytics);

      // 为没有analytics记录的域名创建记录
      for (const domain of domainsData) {
        if (!analyticsData || !analyticsData.some(a => a.domain_id === domain.id)) {
          await createAnalyticsRecord(domain.id);
        }
      }
    } catch (error: any) {
      console.error('Error loading domains:', error);
      toast.error(error.message || '加载域名失败');
      setDomains([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadDomains();
    }
  }, [user, loadDomains]);

  // Create an analytics record for a new domain
  const createAnalyticsRecord = async (domainId: string) => {
    try {
      const { error } = await supabase.from('domain_analytics').insert({
        domain_id: domainId,
        views: 0,
        favorites: 0,
        offers: 0
      });
      
      if (error) {
        console.error('Error creating analytics record:', error);
      }
    } catch (error) {
      console.error('Error creating analytics record:', error);
      // We don't show this error to the user as it's not critical
    }
  };

  const filteredDomains = domains
    .filter(domain => 
      domain.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (domain.description && domain.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .filter(domain => {
      if (activeTab === 'all') return true;
      if (activeTab === 'available') return domain.status === 'available';
      if (activeTab === 'pending') return domain.status === 'pending';
      if (activeTab === 'sold') return domain.status === 'sold';
      return true;
    });

  const renderDomainStatus = (status?: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-500">可售</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">审核中</Badge>;
      case 'sold':
        return <Badge className="bg-blue-500">已售</Badge>;
      default:
        return <Badge className="bg-gray-500">未知</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold">我的域名</h2>
        <DomainActions mode="add" onSuccess={loadDomains} />
      </div>
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <Input 
            placeholder="搜索域名..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="grid grid-cols-4 w-full md:w-auto">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="available">可售</TabsTrigger>
            <TabsTrigger value="pending">审核中</TabsTrigger>
            <TabsTrigger value="sold">已售</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {domains.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500 mb-4">您还没有添加任何域名</p>
            <DomainActions mode="add" onSuccess={loadDomains} />
          </CardContent>
        </Card>
      ) : filteredDomains.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500">没有找到符合条件的域名</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">域名</th>
                <th className="text-left py-3 px-4">价格</th>
                <th className="text-left py-3 px-4">分类</th>
                <th className="text-left py-3 px-4">状态</th>
                <th className="text-left py-3 px-4">统计</th>
                <th className="text-left py-3 px-4">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredDomains.map((domain) => (
                <tr key={domain.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <span className="font-medium">{domain.name}</span>
                      {domain.is_verified && (
                        <Badge variant="outline" className="ml-2 border-green-500 text-green-500">
                          已验证
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">${domain.price.toLocaleString()}</td>
                  <td className="py-3 px-4 capitalize">{domain.category || 'standard'}</td>
                  <td className="py-3 px-4">{renderDomainStatus(domain.status)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-1 text-gray-500" />
                      <span>{domain.views || 0}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Link to={`/domain/${domain.name}`} target="_blank">
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </Link>
                      <DomainActions 
                        domain={domain} 
                        mode="edit" 
                        onSuccess={loadDomains} 
                      />
                      <DomainActions 
                        domain={domain} 
                        mode="delete" 
                        onSuccess={loadDomains} 
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

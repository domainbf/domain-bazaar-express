
import { useState, useEffect } from 'react';
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
}

export const DomainManagement = () => {
  const { user } = useAuth();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (user) {
      loadDomains();
    }
  }, [user]);

  const loadDomains = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('domain_listings')
        .select(`
          *,
          domain_analytics(views)
        `)
        .eq('owner_id', user?.id);
      
      if (error) throw error;
      
      // Transform the data to include view count
      const domainsWithAnalytics = data?.map(domain => {
        const views = domain.domain_analytics?.length > 0 
          ? domain.domain_analytics[0]?.views || 0
          : 0;
        
        return {
          ...domain,
          views: views as number,
          domain_analytics: undefined // Remove the nested object
        };
      }) || [];
      
      console.log('Fetched user domains:', domainsWithAnalytics);
      setDomains(domainsWithAnalytics);

      // Create domain_analytics entries for domains that don't have them
      for (const domain of data || []) {
        if (!domain.domain_analytics || domain.domain_analytics.length === 0) {
          await createAnalyticsRecord(domain.id);
        }
      }
    } catch (error: any) {
      console.error('Error loading domains:', error);
      toast.error(error.message || '加载域名失败');
    } finally {
      setIsLoading(false);
    }
  };

  // Create an analytics record for a new domain
  const createAnalyticsRecord = async (domainId: string) => {
    try {
      await supabase.from('domain_analytics').insert({
        domain_id: domainId,
        views: 0,
        favorites: 0,
        offers: 0
      });
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

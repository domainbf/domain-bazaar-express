
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Eye, Bell, Trash2, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAppCache } from '@/hooks/useAppCache';
import { Tables } from '@/integrations/supabase/types';

// Use the database type directly
type MonitoredDomain = Tables<'domain_monitoring'>;

export const DomainMonitor = () => {
  const { user } = useAuth();
  const [domains, setDomains] = useState<MonitoredDomain[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 使用缓存获取监控域名
  const fetchMonitoredDomains = async (): Promise<MonitoredDomain[]> => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('domain_monitoring')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const {
    data: cachedDomains,
    loading: cacheLoading,
    refresh: refreshCache
  } = useAppCache(
    `domain_monitoring_${user?.id || 'anonymous'}`,
    fetchMonitoredDomains,
    { ttl: 60 * 1000 } // 1分钟缓存
  );

  useEffect(() => {
    if (cachedDomains) {
      setDomains(cachedDomains);
    }
  }, [cachedDomains]);

  // 实际的域名状态检查函数
  const checkDomainStatus = async (domainName: string): Promise<string> => {
    try {
      // 这里应该调用真实的域名检查API
      // 目前模拟检查逻辑
      const response = await fetch(`https://dns.google/resolve?name=${domainName}&type=A`);
      const data = await response.json();
      
      if (data.Status === 0 && data.Answer && data.Answer.length > 0) {
        return 'registered';
      } else if (data.Status === 3) {
        return 'available';
      } else {
        return 'error';
      }
    } catch (error) {
      console.error('Domain check error:', error);
      return 'error';
    }
  };

  const addDomain = async () => {
    if (!newDomain.trim()) {
      toast.error('请输入域名');
      return;
    }

    if (!user) {
      toast.error('请先登录');
      return;
    }

    // 检查域名是否已存在
    const existingDomain = domains.find(d => d.domain_name === newDomain.toLowerCase());
    if (existingDomain) {
      toast.error('该域名已在监控列表中');
      return;
    }

    setIsLoading(true);
    
    try {
      // 检查域名状态
      const status = await checkDomainStatus(newDomain);
      
      // 添加到数据库
      const { data, error } = await supabase
        .from('domain_monitoring')
        .insert({
          user_id: user.id,
          domain_name: newDomain.toLowerCase(),
          status: status,
          notifications_enabled: true,
          check_interval: 3600 // 1小时检查一次
        })
        .select()
        .single();

      if (error) throw error;

      // 更新本地状态
      setDomains(prev => [data, ...prev]);
      setNewDomain('');
      toast.success('域名已添加到监控列表');
      
      // 刷新缓存
      refreshCache();
    } catch (error: any) {
      console.error('Add domain error:', error);
      toast.error('添加失败：' + (error.message || '未知错误'));
    } finally {
      setIsLoading(false);
    }
  };

  const removeDomain = async (id: string) => {
    try {
      const { error } = await supabase
        .from('domain_monitoring')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDomains(prev => prev.filter(d => d.id !== id));
      toast.success('已从监控列表中移除');
      refreshCache();
    } catch (error: any) {
      toast.error('删除失败：' + (error.message || '未知错误'));
    }
  };

  const toggleNotifications = async (id: string) => {
    const domain = domains.find(d => d.id === id);
    if (!domain) return;

    try {
      const { error } = await supabase
        .from('domain_monitoring')
        .update({ notifications_enabled: !domain.notifications_enabled })
        .eq('id', id);

      if (error) throw error;

      setDomains(prev => prev.map(d => 
        d.id === id ? { ...d, notifications_enabled: !d.notifications_enabled } : d
      ));
      toast.success('通知设置已更新');
    } catch (error: any) {
      toast.error('更新失败：' + (error.message || '未知错误'));
    }
  };

  const manualCheckDomain = async (id: string) => {
    const domain = domains.find(d => d.id === id);
    if (!domain) return;

    try {
      const status = await checkDomainStatus(domain.domain_name);
      
      const { error } = await supabase
        .from('domain_monitoring')
        .update({ 
          status: status,
          last_checked: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setDomains(prev => prev.map(d => 
        d.id === id ? { 
          ...d, 
          status: status,
          last_checked: new Date().toISOString()
        } : d
      ));
      toast.success('域名状态已更新');
    } catch (error: any) {
      toast.error('检查失败：' + (error.message || '未知错误'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'registered': return 'bg-red-500';
      case 'expired': return 'bg-yellow-500';
      case 'monitoring': return 'bg-blue-500';
      case 'error': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return '可注册';
      case 'registered': return '已注册';
      case 'expired': return '已过期';
      case 'monitoring': return '监控中';
      case 'error': return '检查失败';
      default: return '未知';
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-600 mb-4">请先登录以使用域名监控功能</p>
          <Button onClick={() => window.location.href = '/auth'}>
            登录
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">域名监控</h2>
        <p className="text-gray-600">实时监控您感兴趣的域名状态变化</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            添加监控域名
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="请输入域名，如: example.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addDomain()}
              className="flex-1"
            />
            <Button onClick={addDomain} disabled={isLoading}>
              {isLoading ? '添加中...' : '开始监控'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {cacheLoading && domains.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <div className="flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              <span>正在加载监控列表...</span>
            </div>
          </CardContent>
        </Card>
      ) : domains.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                监控列表 ({domains.length})
              </div>
              <Button variant="outline" size="sm" onClick={refreshCache}>
                <RefreshCw className="w-4 h-4 mr-1" />
                刷新
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {domains.map((domain) => (
                <div key={domain.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-gray-900">{domain.domain_name}</span>
                      <Badge className={getStatusColor(domain.status)}>
                        {getStatusText(domain.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      最后检查: {domain.last_checked ? new Date(domain.last_checked).toLocaleString() : '未检查'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleNotifications(domain.id)}
                      className={domain.notifications_enabled ? 'text-blue-600' : 'text-gray-400'}
                    >
                      <Bell className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => manualCheckDomain(domain.id)}
                    >
                      立即检查
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeDomain(domain.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">还没有监控任何域名</p>
            <p className="text-sm text-gray-500">添加您感兴趣的域名开始实时监控</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

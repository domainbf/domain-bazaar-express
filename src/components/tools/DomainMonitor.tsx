
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Eye, Bell, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface MonitoredDomain {
  id: string;
  domain: string;
  status: 'available' | 'registered' | 'expired' | 'unknown';
  lastChecked: string;
  notifications: boolean;
}

export const DomainMonitor = () => {
  const { user } = useAuth();
  const [domains, setDomains] = useState<MonitoredDomain[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadMonitoredDomains();
    }
  }, [user]);

  const loadMonitoredDomains = () => {
    // 从localStorage加载监控的域名（在实际应用中应该从后端API获取）
    const saved = localStorage.getItem(`monitored_domains_${user?.id}`);
    if (saved) {
      setDomains(JSON.parse(saved));
    }
  };

  const saveDomains = (updatedDomains: MonitoredDomain[]) => {
    localStorage.setItem(`monitored_domains_${user?.id}`, JSON.stringify(updatedDomains));
    setDomains(updatedDomains);
  };

  const addDomain = async () => {
    if (!newDomain.trim()) {
      toast.error('请输入域名');
      return;
    }

    if (domains.some(d => d.domain === newDomain.toLowerCase())) {
      toast.error('该域名已在监控列表中');
      return;
    }

    setIsLoading(true);
    
    try {
      // 模拟域名状态检查
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const statusOptions: ('available' | 'registered')[] = ['available', 'registered'];
      const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      
      const newMonitoredDomain: MonitoredDomain = {
        id: Date.now().toString(),
        domain: newDomain.toLowerCase(),
        status: randomStatus,
        lastChecked: new Date().toISOString(),
        notifications: true
      };

      const updatedDomains = [...domains, newMonitoredDomain];
      saveDomains(updatedDomains);
      setNewDomain('');
      toast.success('域名已添加到监控列表');
    } catch (error) {
      toast.error('添加失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const removeDomain = (id: string) => {
    const updatedDomains = domains.filter(d => d.id !== id);
    saveDomains(updatedDomains);
    toast.success('已从监控列表中移除');
  };

  const toggleNotifications = (id: string) => {
    const updatedDomains = domains.map(d => 
      d.id === id ? { ...d, notifications: !d.notifications } : d
    );
    saveDomains(updatedDomains);
  };

  const checkDomainStatus = async (id: string) => {
    const statusOptions: ('available' | 'registered')[] = ['available', 'registered'];
    const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    
    const updatedDomains = domains.map(d => 
      d.id === id ? { 
        ...d, 
        status: randomStatus,
        lastChecked: new Date().toISOString() 
      } : d
    );
    saveDomains(updatedDomains);
    toast.success('域名状态已更新');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'registered': return 'bg-red-500';
      case 'expired': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return '可注册';
      case 'registered': return '已注册';
      case 'expired': return '已过期';
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
        <p className="text-gray-600">监控您感兴趣的域名状态变化</p>
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
              {isLoading ? '添加中...' : '添加监控'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {domains.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              监控列表 ({domains.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {domains.map((domain) => (
                <div key={domain.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-gray-900">{domain.domain}</span>
                      <Badge className={getStatusColor(domain.status)}>
                        {getStatusText(domain.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      最后检查: {new Date(domain.lastChecked).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleNotifications(domain.id)}
                      className={domain.notifications ? 'text-blue-600' : 'text-gray-400'}
                    >
                      <Bell className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => checkDomainStatus(domain.id)}
                    >
                      检查状态
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
            <p className="text-sm text-gray-500">添加您感兴趣的域名开始监控</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

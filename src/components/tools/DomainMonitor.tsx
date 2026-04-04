import { supabase } from '@/integrations/supabase/client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Eye, Bell, BellOff, Trash2, Plus, RefreshCw, Globe, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/apiClient';
import { useAppCache } from '@/hooks/useAppCache';

import { motion, AnimatePresence } from 'framer-motion';

type MonitoredDomain = any;

export const DomainMonitor = () => {
  const { user } = useAuth();
  const [domains, setDomains] = useState<MonitoredDomain[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);

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

  const { data: cachedDomains, loading: cacheLoading, refresh: refreshCache } = useAppCache(
    `domain_monitoring_${user?.id || 'anonymous'}`,
    fetchMonitoredDomains,
    { ttl: 60 * 1000 }
  );

  useEffect(() => {
    if (cachedDomains) setDomains(cachedDomains);
  }, [cachedDomains]);

  const checkDomainStatus = async (domainName: string): Promise<string> => {
    try {
      const response = await fetch(`https://dns.google/resolve?name=${domainName}&type=A`);
      const data = await response.json();
      if (data.Status === 0 && data.Answer && data.Answer.length > 0) return 'registered';
      if (data.Status === 3) return 'available';
      return 'error';
    } catch {
      return 'error';
    }
  };

  const validateDomain = (domain: string): boolean => {
    return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/.test(domain);
  };

  const addDomain = async () => {
    const trimmed = newDomain.trim().toLowerCase();
    if (!trimmed) { toast.error('请输入域名'); return; }
    if (!user) { toast.error('请先登录'); return; }
    if (!validateDomain(trimmed)) { toast.error('请输入有效域名，如 example.com'); return; }
    if (domains.find(d => d.domain_name === trimmed)) { toast.error('该域名已在监控列表中'); return; }

    setIsLoading(true);
    try {
      const status = await checkDomainStatus(trimmed);
      const { data, error } = await supabase
        .from('domain_monitoring')
        .insert({ user_id: user.id, domain_name: trimmed, status, notifications_enabled: true, check_interval: 3600 })
        .select().single();
      if (error) throw error;
      setDomains(prev => [data, ...prev]);
      setNewDomain('');
      toast.success('域名已添加到监控列表');
      refreshCache();
    } catch (error: any) {
      toast.error('添加失败：' + (error.message || '未知错误'));
    } finally {
      setIsLoading(false);
    }
  };

  const removeDomain = async (id: string) => {
    try {
      const { error } = await supabase.from('domain_monitoring').delete().eq('id', id);
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
      const { error } = await supabase.from('domain_monitoring')
        .update({ notifications_enabled: !domain.notifications_enabled }).eq('id', id);
      if (error) throw error;
      setDomains(prev => prev.map(d => d.id === id ? { ...d, notifications_enabled: !d.notifications_enabled } : d));
      toast.success(domain.notifications_enabled ? '已关闭通知' : '已开启通知');
    } catch (error: any) {
      toast.error('更新失败');
    }
  };

  const manualCheckDomain = async (id: string) => {
    const domain = domains.find(d => d.id === id);
    if (!domain) return;
    setCheckingId(id);
    try {
      const oldStatus = domain.status;
      const status = await checkDomainStatus(domain.domain_name);
      const now = new Date().toISOString();

      // Record history
      await supabase.from('domain_monitoring_history').insert({
        monitoring_id: id, status_before: oldStatus, status_after: status, checked_at: now
      });

      const { error } = await supabase.from('domain_monitoring')
        .update({ status, last_checked: now }).eq('id', id);
      if (error) throw error;

      setDomains(prev => prev.map(d => d.id === id ? { ...d, status, last_checked: now } : d));
      
      if (oldStatus !== status) {
        toast.success(`域名状态已变更: ${getStatusText(oldStatus)} → ${getStatusText(status)}`);
      } else {
        toast.success('域名状态已更新');
      }
    } catch (error: any) {
      toast.error('检查失败');
    } finally {
      setCheckingId(null);
    }
  };

  const checkAllDomains = async () => {
    for (const domain of domains) {
      await manualCheckDomain(domain.id);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      available: { label: '可注册', variant: 'default' },
      registered: { label: '已注册', variant: 'secondary' },
      expired: { label: '已过期', variant: 'destructive' },
      monitoring: { label: '监控中', variant: 'outline' },
      error: { label: '检查失败', variant: 'destructive' },
    };
    const c = config[status] || { label: '未知', variant: 'outline' as const };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = { available: '可注册', registered: '已注册', expired: '已过期', monitoring: '监控中', error: '检查失败' };
    return map[status] || '未知';
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">请先登录以使用域名监控功能</p>
          <Button onClick={() => window.location.href = '/auth'}>登录</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">域名监控</h2>
        <p className="text-muted-foreground">实时监控您感兴趣的域名状态变化，第一时间获取可注册通知</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="w-5 h-5" />
            添加监控域名
          </CardTitle>
          <CardDescription>输入域名开始监控，系统会定期检查状态变化</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="请输入域名，如: example.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addDomain()}
              className="flex-1"
            />
            <Button onClick={addDomain} disabled={isLoading}>
              {isLoading ? <><RefreshCw className="w-4 h-4 mr-1 animate-spin" />添加中</> : '开始监控'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {cacheLoading && domains.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-3" />
            <span className="text-muted-foreground">正在加载监控列表...</span>
          </CardContent>
        </Card>
      ) : domains.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg">
                <Eye className="w-5 h-5" />
                监控列表 ({domains.length})
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={checkAllDomains} disabled={checkingId !== null}>
                  <RefreshCw className={`w-4 h-4 mr-1 ${checkingId ? 'animate-spin' : ''}`} />
                  全部检查
                </Button>
                <Button variant="outline" size="sm" onClick={refreshCache}>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  刷新
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <AnimatePresence>
                {domains.map((domain) => (
                  <motion.div
                    key={domain.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-border rounded-xl bg-card"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="font-semibold text-foreground truncate">{domain.domain_name}</span>
                        {getStatusBadge(domain.status)}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        最后检查: {domain.last_checked ? new Date(domain.last_checked).toLocaleString() : '未检查'}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm" variant="outline"
                        onClick={() => toggleNotifications(domain.id)}
                        title={domain.notifications_enabled ? '关闭通知' : '开启通知'}
                      >
                        {domain.notifications_enabled
                          ? <Bell className="w-4 h-4 text-primary" />
                          : <BellOff className="w-4 h-4 text-muted-foreground" />
                        }
                      </Button>
                      <Button
                        size="sm" variant="outline"
                        onClick={() => manualCheckDomain(domain.id)}
                        disabled={checkingId === domain.id}
                      >
                        {checkingId === domain.id
                          ? <RefreshCw className="w-4 h-4 animate-spin" />
                          : '立即检查'
                        }
                      </Button>
                      <Button
                        size="sm" variant="outline"
                        onClick={() => removeDomain(domain.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-16">
            <Eye className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-foreground font-medium mb-2">还没有监控任何域名</p>
            <p className="text-sm text-muted-foreground">添加您感兴趣的域名开始实时监控</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAdminVerificationService } from '@/hooks/verification/useAdminVerificationService';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Eye,
  AlertTriangle,
  Calendar,
  User,
  Globe,
  FileText
} from 'lucide-react';

interface Verification {
  id: string;
  domain_id: string;
  status: string;
  verification_type: string;
  verification_method?: string;
  created_at: string;
  updated_at?: string;
  user_id?: string;
  verification_data?: any;
  domain?: {
    name: string;
    price: number;
    owner_id?: string;
  };
  user?: {
    username?: string;
    full_name?: string;
    contact_email?: string;
  };
}

export const PendingVerifications = () => {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [allVerifications, setAllVerifications] = useState<Verification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const { fetchPendingVerifications, approveVerification, rejectVerification } = useAdminVerificationService();
  const { t } = useTranslation();

  useEffect(() => {
    loadAllVerifications();
  }, []);

  const loadAllVerifications = async () => {
    setIsLoading(true);
    try {
      // 获取所有验证记录
      const { data, error } = await supabase
        .from('domain_verifications')
        .select(`
          *,
          domain_listings!domain_verifications_domain_id_fkey(name, price, owner_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedData = (data || []).map(v => ({
        ...v,
        domain: v.domain_listings
      }));

      setAllVerifications(processedData);
      
      // 筛选待处理的
      const pending = processedData.filter(v => v.status === 'pending');
      setVerifications(pending);
    } catch (error) {
      console.error('Error loading verifications:', error);
      toast.error('加载验证请求失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveVerification = async (id: string) => {
    try {
      await approveVerification(id);
      toast.success('验证已通过');
      loadAllVerifications();
    } catch (error) {
      console.error('Error approving verification:', error);
      toast.error('审批失败');
    }
  };

  const handleRejectVerification = async () => {
    if (!selectedVerification) return;
    
    try {
      await rejectVerification(selectedVerification.id);
      toast.success('验证已拒绝');
      setIsRejectDialogOpen(false);
      setRejectReason('');
      setSelectedVerification(null);
      loadAllVerifications();
    } catch (error) {
      console.error('Error rejecting verification:', error);
      toast.error('拒绝操作失败');
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await loadAllVerifications();
    setIsRefreshing(false);
    toast.success('数据已刷新');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />已验证</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />待审核</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />已拒绝</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMethodLabel = (method?: string) => {
    const labels: Record<string, string> = {
      'dns': 'DNS验证',
      'file': '文件验证',
      'email': '邮箱验证',
      'whois': 'WHOIS验证'
    };
    return labels[method || ''] || method || '未知';
  };

  const filteredVerifications = allVerifications.filter(v => {
    const matchesSearch = searchQuery === '' || 
      v.domain?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: allVerifications.length,
    pending: allVerifications.filter(v => v.status === 'pending').length,
    verified: allVerifications.filter(v => v.status === 'verified').length,
    rejected: allVerifications.filter(v => v.status === 'rejected').length
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部统计 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">总请求数</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">待审核</p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
            <p className="text-xs text-muted-foreground">已通过</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            <p className="text-xs text-muted-foreground">已拒绝</p>
          </CardContent>
        </Card>
      </div>

      {/* 工具栏 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5" />
          域名验证管理
        </h2>
        <Button variant="outline" size="sm" onClick={refreshData} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* 筛选 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2 items-center">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索域名..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="状态筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="pending">待审核</SelectItem>
            <SelectItem value="verified">已通过</SelectItem>
            <SelectItem value="rejected">已拒绝</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 验证列表 */}
      {filteredVerifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">暂无验证请求</h3>
            <p className="text-muted-foreground">
              {statusFilter === 'pending' ? '没有待处理的验证请求' : '没有符合条件的验证记录'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredVerifications.map((verification) => (
            <Card key={verification.id} className={verification.status === 'pending' ? 'border-yellow-200' : ''}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Globe className="h-5 w-5" />
                      {verification.domain?.name || '未知域名'}
                      {getStatusBadge(verification.status)}
                    </CardTitle>
                    <CardDescription className="mt-2 space-y-1">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          验证方式: {getMethodLabel(verification.verification_method)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          提交时间: {new Date(verification.created_at).toLocaleString()}
                        </span>
                      </div>
                      {verification.domain?.price && (
                        <p className="text-sm">域名价格: ¥{verification.domain.price.toLocaleString()}</p>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedVerification(verification);
                        setIsDetailDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      详情
                    </Button>
                    {verification.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApproveVerification(verification.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          通过
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedVerification(verification);
                            setIsRejectDialogOpen(true);
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          拒绝
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <div className="text-sm text-muted-foreground text-center">
        显示 {filteredVerifications.length} / {allVerifications.length} 条记录
      </div>

      {/* 详情对话框 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>验证详情</DialogTitle>
            <DialogDescription>
              查看域名验证的详细信息
            </DialogDescription>
          </DialogHeader>
          {selectedVerification && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">域名</label>
                  <p className="font-medium">{selectedVerification.domain?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">状态</label>
                  <div>{getStatusBadge(selectedVerification.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">验证类型</label>
                  <p>{selectedVerification.verification_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">验证方式</label>
                  <p>{getMethodLabel(selectedVerification.verification_method)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">提交时间</label>
                  <p>{new Date(selectedVerification.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">更新时间</label>
                  <p>{selectedVerification.updated_at ? new Date(selectedVerification.updated_at).toLocaleString() : '-'}</p>
                </div>
              </div>
              {selectedVerification.verification_data && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">验证数据</label>
                  <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-auto max-h-48">
                    {JSON.stringify(selectedVerification.verification_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 拒绝对话框 */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              拒绝验证
            </DialogTitle>
            <DialogDescription>
              确定要拒绝此域名的验证请求吗？
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">域名</label>
              <p className="font-medium">{selectedVerification?.domain?.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium">拒绝理由（可选）</label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请输入拒绝理由..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleRejectVerification}>
              确认拒绝
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
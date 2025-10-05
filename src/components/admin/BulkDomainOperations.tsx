import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Layers, Trash2, DollarSign, Tag, CheckCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const BulkDomainOperations = () => {
  const [selectedDomainIds, setSelectedDomainIds] = useState<string[]>([]);
  const [operation, setOperation] = useState<'delete' | 'update_status' | 'update_price' | 'update_category'>('update_status');
  const [newStatus, setNewStatus] = useState('available');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('standard');
  const [domainSearchQuery, setDomainSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [domains, setDomains] = useState<any[]>([]);
  const [isLoadingDomains, setIsLoadingDomains] = useState(false);

  const loadDomains = async () => {
    setIsLoadingDomains(true);
    try {
      let query = supabase
        .from('domain_listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (domainSearchQuery) {
        query = query.ilike('name', `%${domainSearchQuery}%`);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      setDomains(data || []);
    } catch (error: any) {
      toast.error('加载域名列表失败');
      console.error(error);
    } finally {
      setIsLoadingDomains(false);
    }
  };

  const handleBulkOperation = async () => {
    if (selectedDomainIds.length === 0) {
      toast.error('请至少选择一个域名');
      return;
    }

    setIsProcessing(true);
    try {
      let updateData: any = {};

      switch (operation) {
        case 'update_status':
          updateData = { status: newStatus };
          break;
        case 'update_price':
          if (!newPrice || isNaN(parseFloat(newPrice))) {
            toast.error('请输入有效的价格');
            return;
          }
          updateData = { price: parseFloat(newPrice) };
          break;
        case 'update_category':
          updateData = { category: newCategory };
          break;
        case 'delete':
          const { error: deleteError } = await supabase
            .from('domain_listings')
            .delete()
            .in('id', selectedDomainIds);

          if (deleteError) throw deleteError;

          // 记录批量操作
          await supabase.from('domain_bulk_operations').insert({
            operation_type: 'delete',
            domain_ids: selectedDomainIds,
            performed_by: (await supabase.auth.getUser()).data.user?.id,
            details: { count: selectedDomainIds.length }
          });

          toast.success(`成功删除 ${selectedDomainIds.length} 个域名`);
          setSelectedDomainIds([]);
          loadDomains();
          setIsProcessing(false);
          return;
      }

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('domain_listings')
          .update(updateData)
          .in('id', selectedDomainIds);

        if (error) throw error;

        // 记录批量操作
        await supabase.from('domain_bulk_operations').insert({
          operation_type: operation,
          domain_ids: selectedDomainIds,
          performed_by: (await supabase.auth.getUser()).data.user?.id,
          details: { update: updateData, count: selectedDomainIds.length }
        });

        toast.success(`成功更新 ${selectedDomainIds.length} 个域名`);
        setSelectedDomainIds([]);
        loadDomains();
      }
    } catch (error: any) {
      toast.error(error.message || '批量操作失败');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleDomainSelection = (domainId: string) => {
    setSelectedDomainIds(prev =>
      prev.includes(domainId)
        ? prev.filter(id => id !== domainId)
        : [...prev, domainId]
    );
  };

  const selectAllDomains = () => {
    setSelectedDomainIds(domains.map(d => d.id));
  };

  const deselectAllDomains = () => {
    setSelectedDomainIds([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="w-5 h-5" />
          批量域名操作
        </CardTitle>
        <CardDescription>对多个域名执行批量操作</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 搜索和加载域名 */}
        <div className="space-y-3">
          <Label>搜索域名</Label>
          <div className="flex gap-2">
            <Input
              placeholder="输入域名名称搜索..."
              value={domainSearchQuery}
              onChange={(e) => setDomainSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && loadDomains()}
            />
            <Button onClick={loadDomains} disabled={isLoadingDomains}>
              {isLoadingDomains ? '加载中...' : '搜索'}
            </Button>
          </div>
        </div>

        {/* 域名列表 */}
        {domains.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>选择域名 ({selectedDomainIds.length}/{domains.length})</Label>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={selectAllDomains}>
                  全选
                </Button>
                <Button size="sm" variant="outline" onClick={deselectAllDomains}>
                  取消全选
                </Button>
              </div>
            </div>
            <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
              {domains.map((domain) => (
                <div key={domain.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                  <Checkbox
                    checked={selectedDomainIds.includes(domain.id)}
                    onCheckedChange={() => toggleDomainSelection(domain.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{domain.name}</p>
                    <p className="text-sm text-gray-500">
                      ¥{domain.price} · {domain.status} · {domain.category}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 操作选择 */}
        <div className="space-y-3">
          <Label>选择操作</Label>
          <Select value={operation} onValueChange={(v: any) => setOperation(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="update_status">更新状态</SelectItem>
              <SelectItem value="update_price">更新价格</SelectItem>
              <SelectItem value="update_category">更新分类</SelectItem>
              <SelectItem value="delete">删除域名</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 操作参数 */}
        {operation === 'update_status' && (
          <div className="space-y-2">
            <Label>新状态</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">可售</SelectItem>
                <SelectItem value="sold">已售</SelectItem>
                <SelectItem value="reserved">保留</SelectItem>
                <SelectItem value="pending">待审核</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {operation === 'update_price' && (
          <div className="space-y-2">
            <Label>新价格</Label>
            <Input
              type="number"
              placeholder="输入新价格"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
            />
          </div>
        )}

        {operation === 'update_category' && (
          <div className="space-y-2">
            <Label>新分类</Label>
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="premium">高端</SelectItem>
                <SelectItem value="standard">标准</SelectItem>
                <SelectItem value="short">短域名</SelectItem>
                <SelectItem value="numeric">数字</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 执行按钮 */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              className="w-full"
              disabled={selectedDomainIds.length === 0 || isProcessing}
              variant={operation === 'delete' ? 'destructive' : 'default'}
            >
              {isProcessing ? '处理中...' : `执行批量操作 (${selectedDomainIds.length})`}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认批量操作</AlertDialogTitle>
              <AlertDialogDescription>
                您即将对 {selectedDomainIds.length} 个域名执行 {operation === 'delete' ? '删除' : '更新'} 操作。
                {operation === 'delete' && '删除操作不可恢复，'}请确认是否继续？
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={handleBulkOperation}>
                确认执行
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

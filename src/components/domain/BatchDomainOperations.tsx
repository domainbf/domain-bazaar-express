
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package, 
  Edit, 
  Trash2, 
  Tag, 
  DollarSign,
  Download,
  Upload,
  CheckSquare,
  Square
} from 'lucide-react';
import { toast } from 'sonner';
import { Domain } from '@/types/domain';

interface BatchDomainOperationsProps {
  domains: Domain[];
  selectedDomains: string[];
  onSelectionChange: (domainIds: string[]) => void;
  onDomainsUpdate: () => void;
}

export const BatchDomainOperations: React.FC<BatchDomainOperationsProps> = ({
  domains,
  selectedDomains,
  onSelectionChange,
  onDomainsUpdate
}) => {
  const [batchAction, setBatchAction] = useState<string>('');
  const [batchPrice, setBatchPrice] = useState<string>('');
  const [batchCategory, setBatchCategory] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectAll = () => {
    if (selectedDomains.length === domains.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(domains.map(d => d.id));
    }
  };

  const handleDomainSelect = (domainId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedDomains, domainId]);
    } else {
      onSelectionChange(selectedDomains.filter(id => id !== domainId));
    }
  };

  const executeBatchAction = async () => {
    if (selectedDomains.length === 0) {
      toast.error('请选择要操作的域名');
      return;
    }

    if (!batchAction) {
      toast.error('请选择操作类型');
      return;
    }

    setIsProcessing(true);
    
    try {
      switch (batchAction) {
        case 'updatePrice':
          if (!batchPrice) {
            toast.error('请输入新价格');
            return;
          }
          await updateBatchPrices(Number(batchPrice));
          break;
        case 'updateCategory':
          if (!batchCategory) {
            toast.error('请选择新分类');
            return;
          }
          await updateBatchCategories(batchCategory);
          break;
        case 'setAvailable':
          await updateBatchStatus('available');
          break;
        case 'setSold':
          await updateBatchStatus('sold');
          break;
        case 'delete':
          await deleteBatchDomains();
          break;
        case 'export':
          exportSelectedDomains();
          break;
        default:
          toast.error('未知操作类型');
      }
      
      onDomainsUpdate();
      toast.success(`批量操作完成，处理了 ${selectedDomains.length} 个域名`);
    } catch (error) {
      console.error('Batch operation error:', error);
      toast.error('批量操作失败');
    } finally {
      setIsProcessing(false);
      setBatchAction('');
      setBatchPrice('');
      setBatchCategory('');
      onSelectionChange([]);
    }
  };

  const updateBatchPrices = async (newPrice: number) => {
    // 模拟批量更新价格
    console.log('Updating prices for domains:', selectedDomains, 'to:', newPrice);
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const updateBatchCategories = async (newCategory: string) => {
    // 模拟批量更新分类
    console.log('Updating categories for domains:', selectedDomains, 'to:', newCategory);
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const updateBatchStatus = async (status: string) => {
    // 模拟批量更新状态
    console.log('Updating status for domains:', selectedDomains, 'to:', status);
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const deleteBatchDomains = async () => {
    // 模拟批量删除
    console.log('Deleting domains:', selectedDomains);
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const exportSelectedDomains = () => {
    const selectedDomainsData = domains.filter(d => selectedDomains.includes(d.id));
    const csvContent = [
      'Domain Name,Price,Category,Status,Description',
      ...selectedDomainsData.map(d => 
        `${d.name},${d.price},${d.category || ''},${d.status || ''},${d.description || ''}`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `domains_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('域名数据已导出');
  };

  const categories = [
    { value: 'premium', label: '精品域名' },
    { value: 'short', label: '短域名' },
    { value: 'numeric', label: '数字域名' },
    { value: 'brandable', label: '品牌域名' },
    { value: 'keyword', label: '关键词域名' }
  ];

  return (
    <div className="space-y-6">
      {/* 批量操作控制面板 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            批量域名操作
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedDomains.length === domains.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                全选
              </Button>
              <Badge variant="secondary">
                已选择 {selectedDomains.length} / {domains.length} 个域名
              </Badge>
            </div>
          </div>

          {selectedDomains.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <Select value={batchAction} onValueChange={setBatchAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择操作" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updatePrice">批量改价</SelectItem>
                    <SelectItem value="updateCategory">批量改分类</SelectItem>
                    <SelectItem value="setAvailable">设为可售</SelectItem>
                    <SelectItem value="setSold">设为已售</SelectItem>
                    <SelectItem value="export">导出数据</SelectItem>
                    <SelectItem value="delete">批量删除</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {batchAction === 'updatePrice' && (
                <Input
                  type="number"
                  placeholder="新价格"
                  value={batchPrice}
                  onChange={(e) => setBatchPrice(e.target.value)}
                />
              )}

              {batchAction === 'updateCategory' && (
                <Select value={batchCategory} onValueChange={setBatchCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button
                onClick={executeBatchAction}
                disabled={isProcessing || !batchAction}
                className="w-full"
              >
                {isProcessing ? '处理中...' : '执行操作'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 域名列表 */}
      <Card>
        <CardHeader>
          <CardTitle>域名列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {domains.map((domain) => (
              <div
                key={domain.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  selectedDomains.includes(domain.id) 
                    ? 'bg-primary/5 border-primary/20' 
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedDomains.includes(domain.id)}
                    onCheckedChange={(checked) => 
                      handleDomainSelect(domain.id, checked as boolean)
                    }
                  />
                  <div>
                    <div className="font-medium">{domain.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {domain.category} • {domain.status}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <Badge variant="outline">{domain.category}</Badge>
                  <Badge variant={domain.status === 'available' ? 'default' : 'secondary'}>
                    {domain.status}
                  </Badge>
                  <div className="text-right">
                    <div className="font-bold">¥{domain.price.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">
                      {domain.views || 0} 浏览
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {domains.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无域名数据</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

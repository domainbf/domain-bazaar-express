
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { X, Filter, Search } from 'lucide-react';
import { SearchFilters } from '@/types/domain';

interface AdvancedSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const AdvancedSearchFilters: React.FC<AdvancedSearchFiltersProps> = ({
  filters,
  onFiltersChange,
  onClose,
  isOpen
}) => {
  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const addKeyword = (keyword: string) => {
    if (keyword && !filters.keywords?.includes(keyword)) {
      updateFilter('keywords', [...(filters.keywords || []), keyword]);
    }
  };

  const removeKeyword = (keyword: string) => {
    updateFilter('keywords', filters.keywords?.filter(k => k !== keyword) || []);
  };

  const categories = [
    { value: 'premium', label: '精品域名' },
    { value: 'short', label: '短域名' },
    { value: 'numeric', label: '数字域名' },
    { value: 'brandable', label: '品牌域名' },
    { value: 'keyword', label: '关键词域名' },
    { value: 'geographic', label: '地理域名' },
    { value: 'industry', label: '行业域名' }
  ];

  const extensions = [
    '.com', '.net', '.org', '.io', '.ai', '.co', '.cn', '.com.cn', '.cc', '.me'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              高级搜索筛选
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 基础筛选 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">基础筛选</h3>
              
              {/* 分类 */}
              <div className="space-y-2">
                <Label>域名分类</Label>
                <Select
                  value={filters.category || ''}
                  onValueChange={(value) => updateFilter('category', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部分类</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 价格范围 */}
              <div className="space-y-3">
                <Label>价格范围 (¥)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="minPrice" className="text-xs text-muted-foreground">最低价格</Label>
                    <Input
                      id="minPrice"
                      type="number"
                      placeholder="0"
                      value={filters.priceRange?.min || ''}
                      onChange={(e) => updateFilter('priceRange', {
                        ...filters.priceRange,
                        min: Number(e.target.value) || 0
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxPrice" className="text-xs text-muted-foreground">最高价格</Label>
                    <Input
                      id="maxPrice"
                      type="number"
                      placeholder="无限制"
                      value={filters.priceRange?.max || ''}
                      onChange={(e) => updateFilter('priceRange', {
                        ...filters.priceRange,
                        max: Number(e.target.value) || 0
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* 域名长度 */}
              <div className="space-y-3">
                <Label>域名长度</Label>
                <div className="space-y-2">
                  <Slider
                    value={[filters.length?.min || 1, filters.length?.max || 20]}
                    onValueChange={([min, max]) => updateFilter('length', { min, max })}
                    max={50}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{filters.length?.min || 1} 字符</span>
                    <span>{filters.length?.max || 20} 字符</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 高级筛选 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">高级筛选</h3>
              
              {/* 域名后缀 */}
              <div className="space-y-2">
                <Label>域名后缀</Label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {extensions.map(ext => (
                    <div key={ext} className="flex items-center space-x-2">
                      <Checkbox
                        id={ext}
                        checked={filters.extension?.includes(ext) || false}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateFilter('extension', [...(filters.extension || []), ext]);
                          } else {
                            updateFilter('extension', filters.extension?.filter(e => e !== ext) || []);
                          }
                        }}
                      />
                      <Label htmlFor={ext} className="text-sm">{ext}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* 关键词 */}
              <div className="space-y-2">
                <Label>关键词</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="输入关键词..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addKeyword(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addKeyword(input.value);
                      input.value = '';
                    }}
                  >
                    添加
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {filters.keywords?.map(keyword => (
                    <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                      {keyword}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeKeyword(keyword)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 排序方式 */}
              <div className="space-y-2">
                <Label>排序方式</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={filters.sortBy || 'created_at'}
                    onValueChange={(value) => updateFilter('sortBy', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">创建时间</SelectItem>
                      <SelectItem value="price">价格</SelectItem>
                      <SelectItem value="name">名称</SelectItem>
                      <SelectItem value="length">长度</SelectItem>
                      <SelectItem value="popularity">热度</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.sortOrder || 'desc'}
                    onValueChange={(value) => updateFilter('sortOrder', value as 'asc' | 'desc')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">升序</SelectItem>
                      <SelectItem value="desc">降序</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-6 border-t">
            <Button variant="outline" onClick={clearAllFilters} className="flex-1">
              清除所有筛选
            </Button>
            <Button onClick={onClose} className="flex-1">
              <Search className="h-4 w-4 mr-2" />
              应用筛选
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

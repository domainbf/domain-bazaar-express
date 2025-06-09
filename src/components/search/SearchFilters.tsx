
import React from 'react';
import { SearchFilters as SearchFiltersType } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
  onClose: () => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
  onClose
}) => {
  const updateFilter = (key: keyof SearchFiltersType, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const categories = [
    { value: 'premium', label: '精品域名' },
    { value: 'short', label: '短域名' },
    { value: 'numeric', label: '数字域名' },
    { value: 'brandable', label: '品牌域名' },
    { value: 'keyword', label: '关键词域名' }
  ];

  const extensions = [
    '.com', '.net', '.org', '.io', '.ai', '.co', '.cn', '.com.cn'
  ];

  const sortOptions = [
    { value: 'price', label: '价格' },
    { value: 'name', label: '名称' },
    { value: 'length', label: '长度' },
    { value: 'popularity', label: '热度' }
  ];

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">搜索筛选</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 分类 */}
        <div className="space-y-2">
          <Label htmlFor="category">域名分类</Label>
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
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="minLength" className="text-xs text-muted-foreground">最短长度</Label>
              <Input
                id="minLength"
                type="number"
                placeholder="1"
                value={filters.length?.min || ''}
                onChange={(e) => updateFilter('length', {
                  ...filters.length,
                  min: Number(e.target.value) || 1
                })}
              />
            </div>
            <div>
              <Label htmlFor="maxLength" className="text-xs text-muted-foreground">最长长度</Label>
              <Input
                id="maxLength"
                type="number"
                placeholder="50"
                value={filters.length?.max || ''}
                onChange={(e) => updateFilter('length', {
                  ...filters.length,
                  max: Number(e.target.value) || 50
                })}
              />
            </div>
          </div>
        </div>

        {/* 排序方式 */}
        <div className="space-y-2">
          <Label>排序方式</Label>
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={filters.sortBy || ''}
              onValueChange={(value) => updateFilter('sortBy', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="排序字段" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.sortOrder || 'asc'}
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

        {/* 操作按钮 */}
        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={clearFilters} className="flex-1">
            清除筛选
          </Button>
          <Button onClick={onClose} className="flex-1">
            应用筛选
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

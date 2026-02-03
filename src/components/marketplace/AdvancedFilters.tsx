import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface AdvancedFiltersState {
  priceMin: string;
  priceMax: string;
  lengthMin: string;
  lengthMax: string;
  extensions: string[];
  verifiedOnly: boolean;
  category: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface AdvancedFiltersProps {
  filters: AdvancedFiltersState;
  onFiltersChange: (filters: AdvancedFiltersState) => void;
  activeFiltersCount: number;
  isMobile?: boolean;
}

const DOMAIN_EXTENSIONS = [
  '.com', '.net', '.org', '.io', '.ai', '.co', '.cn', '.com.cn', 
  '.dev', '.app', '.xyz', '.me', '.info', '.biz', '.tech'
];

const CATEGORIES = [
  { value: 'all', label: '全部分类' },
  { value: 'premium', label: '精品域名' },
  { value: 'short', label: '短域名' },
  { value: 'business', label: '商业域名' },
  { value: 'tech', label: '科技域名' },
  { value: 'numeric', label: '数字域名' },
  { value: 'brandable', label: '品牌域名' },
];

const SORT_OPTIONS = [
  { value: 'created_at', label: '上架时间' },
  { value: 'price', label: '价格' },
  { value: 'name', label: '域名名称' },
  { value: 'views', label: '浏览量' },
];

export const AdvancedFilters = ({
  filters,
  onFiltersChange,
  activeFiltersCount,
  isMobile = false
}: AdvancedFiltersProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<AdvancedFiltersState>(filters);

  const handleExtensionToggle = (ext: string) => {
    const newExtensions = localFilters.extensions.includes(ext)
      ? localFilters.extensions.filter(e => e !== ext)
      : [...localFilters.extensions, ext];
    setLocalFilters({ ...localFilters, extensions: newExtensions });
  };

  const handleReset = () => {
    const defaultFilters: AdvancedFiltersState = {
      priceMin: '',
      priceMax: '',
      lengthMin: '',
      lengthMax: '',
      extensions: [],
      verifiedOnly: false,
      category: 'all',
      sortBy: 'created_at',
      sortOrder: 'desc',
    };
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const updateLocalFilter = <K extends keyof AdvancedFiltersState>(
    key: K,
    value: AdvancedFiltersState[K]
  ) => {
    setLocalFilters({ ...localFilters, [key]: value });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size={isMobile ? "sm" : "default"}
          className="gap-2 relative"
        >
          <Filter className="h-4 w-4" />
          高级筛选
          {activeFiltersCount > 0 && (
            <Badge 
              variant="default" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "h-[85vh]" : "w-[400px] sm:w-[540px]"}>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            高级筛选
          </SheetTitle>
          <SheetDescription>
            使用多维度筛选条件精准找到您需要的域名
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          {/* 价格范围 */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">价格范围 (¥)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="priceMin" className="text-xs text-muted-foreground">最低价格</Label>
                <Input
                  id="priceMin"
                  type="number"
                  placeholder="0"
                  value={localFilters.priceMin}
                  onChange={(e) => updateLocalFilter('priceMin', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="priceMax" className="text-xs text-muted-foreground">最高价格</Label>
                <Input
                  id="priceMax"
                  type="number"
                  placeholder="不限"
                  value={localFilters.priceMax}
                  onChange={(e) => updateLocalFilter('priceMax', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 域名长度 */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">域名长度（不含后缀）</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="lengthMin" className="text-xs text-muted-foreground">最短</Label>
                <Input
                  id="lengthMin"
                  type="number"
                  placeholder="1"
                  min={1}
                  max={63}
                  value={localFilters.lengthMin}
                  onChange={(e) => updateLocalFilter('lengthMin', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="lengthMax" className="text-xs text-muted-foreground">最长</Label>
                <Input
                  id="lengthMax"
                  type="number"
                  placeholder="不限"
                  min={1}
                  max={63}
                  value={localFilters.lengthMax}
                  onChange={(e) => updateLocalFilter('lengthMax', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 域名后缀 */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">域名后缀</Label>
            <div className="flex flex-wrap gap-2">
              {DOMAIN_EXTENSIONS.map((ext) => (
                <Badge
                  key={ext}
                  variant={localFilters.extensions.includes(ext) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/80 transition-colors"
                  onClick={() => handleExtensionToggle(ext)}
                >
                  {ext}
                  {localFilters.extensions.includes(ext) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
            {localFilters.extensions.length > 0 && (
              <p className="text-xs text-muted-foreground">
                已选择 {localFilters.extensions.length} 个后缀
              </p>
            )}
          </div>

          {/* 分类 */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">域名分类</Label>
            <Select
              value={localFilters.category}
              onValueChange={(value) => updateLocalFilter('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 排序 */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">排序方式</Label>
            <div className="grid grid-cols-2 gap-3">
              <Select
                value={localFilters.sortBy}
                onValueChange={(value) => updateLocalFilter('sortBy', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="排序字段" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={localFilters.sortOrder}
                onValueChange={(value) => updateLocalFilter('sortOrder', value as 'asc' | 'desc')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">降序</SelectItem>
                  <SelectItem value="asc">升序</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 仅显示已验证 */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-sm font-semibold">仅显示已验证域名</Label>
              <p className="text-xs text-muted-foreground mt-1">
                已验证域名经过所有权认证，交易更安全
              </p>
            </div>
            <Switch
              checked={localFilters.verifiedOnly}
              onCheckedChange={(checked) => updateLocalFilter('verifiedOnly', checked)}
            />
          </div>
        </div>

        <SheetFooter className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleReset} className="flex-1 gap-2">
            <RotateCcw className="h-4 w-4" />
            重置
          </Button>
          <Button onClick={handleApply} className="flex-1">
            应用筛选
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

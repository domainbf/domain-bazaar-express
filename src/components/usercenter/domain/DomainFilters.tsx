
import { Input } from "@/components/ui/input";
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DomainFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sortBy?: string;
  setSortBy?: (sort: string) => void;
  priceRange?: string;
  setPriceRange?: (range: string) => void;
  category?: string;
  setCategory?: (category: string) => void;
  totalCount?: number;
}

export const DomainFilters = ({ 
  searchQuery, 
  setSearchQuery, 
  activeTab, 
  setActiveTab,
  sortBy = 'newest',
  setSortBy,
  priceRange = 'all',
  setPriceRange,
  category = 'all',
  setCategory,
  totalCount = 0
}: DomainFiltersProps) => {
  return (
    <div className="space-y-4">
      {/* 顶部搜索和状态筛选 */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <Input 
            placeholder="搜索域名名称、描述..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex items-center gap-2">
          {totalCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              共 {totalCount} 个域名
            </Badge>
          )}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList className="grid grid-cols-4 w-full md:w-auto">
              <TabsTrigger value="all" className="text-xs md:text-sm">全部</TabsTrigger>
              <TabsTrigger value="available" className="text-xs md:text-sm">可售</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs md:text-sm">审核中</TabsTrigger>
              <TabsTrigger value="sold" className="text-xs md:text-sm">已售</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* 高级筛选 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">筛选：</span>
        </div>
        
        {/* 价格区间 */}
        {setPriceRange && (
          <Select value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder="价格区间" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部价格</SelectItem>
              <SelectItem value="0-1000">¥0 - ¥1,000</SelectItem>
              <SelectItem value="1000-5000">¥1,000 - ¥5,000</SelectItem>
              <SelectItem value="5000-10000">¥5,000 - ¥10,000</SelectItem>
              <SelectItem value="10000+">¥10,000+</SelectItem>
            </SelectContent>
          </Select>
        )}
        
        {/* 分类筛选 */}
        {setCategory && (
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue placeholder="分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              <SelectItem value="premium">精品</SelectItem>
              <SelectItem value="standard">普通</SelectItem>
              <SelectItem value="numeric">数字</SelectItem>
              <SelectItem value="short">短域名</SelectItem>
              <SelectItem value="brandable">品牌</SelectItem>
            </SelectContent>
          </Select>
        )}
        
        {/* 排序 */}
        {setSortBy && (
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue placeholder="排序" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">最新添加</SelectItem>
              <SelectItem value="oldest">最早添加</SelectItem>
              <SelectItem value="price-low">价格低到高</SelectItem>
              <SelectItem value="price-high">价格高到低</SelectItem>
              <SelectItem value="name">名称排序</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
};

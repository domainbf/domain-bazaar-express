
import { ProfileDomain } from "@/types/userProfile";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Grid, List, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DomainGrid } from "./DomainGrid";
import { DomainTable } from "./DomainTable";

interface UserDomainListProps {
  domains: ProfileDomain[];
}

export const UserDomainList = ({ domains }: UserDomainListProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const filteredDomains = domains.filter(domain => {
    // Filter by search query
    const matchesSearch = domain.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (domain.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by category
    const matchesCategory = categoryFilter === 'all' || domain.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>域名列表</CardTitle>
          
          <div className="flex items-center gap-2">
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm" 
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 p-0"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm" 
              onClick={() => setViewMode('list')}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="搜索域名..." 
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select 
            value={categoryFilter} 
            onValueChange={setCategoryFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              <SelectItem value="standard">标准</SelectItem>
              <SelectItem value="premium">高级</SelectItem>
              <SelectItem value="short">短域名</SelectItem>
              <SelectItem value="dev">开发</SelectItem>
              <SelectItem value="brandable">品牌</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {filteredDomains.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>没有找到符合条件的域名</p>
          </div>
        ) : viewMode === 'grid' ? (
          <DomainGrid domains={filteredDomains} />
        ) : (
          <DomainTable domains={filteredDomains} />
        )}
      </CardContent>
    </Card>
  );
};

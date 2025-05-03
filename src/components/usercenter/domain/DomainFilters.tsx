
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DomainFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const DomainFilters = ({ searchQuery, setSearchQuery, activeTab, setActiveTab }: DomainFiltersProps) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="relative w-full md:w-64">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
        <Input 
          placeholder="搜索域名..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
        <TabsList className="grid grid-cols-4 w-full md:w-auto">
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="available">可售</TabsTrigger>
          <TabsTrigger value="pending">审核中</TabsTrigger>
          <TabsTrigger value="sold">已售</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

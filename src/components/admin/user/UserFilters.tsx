
import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Filter } from 'lucide-react';

interface UserFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export const UserFilters = ({ 
  searchQuery, 
  onSearchChange 
}: UserFiltersProps) => {
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  
  useEffect(() => {
    // Here we would apply the filters
    // For now, we're just handling the search query in the parent component
  }, [role, status]);
  
  return (
    <div className="bg-white p-4 rounded-lg border flex flex-col sm:flex-row gap-4 items-end">
      <div className="flex-1">
        <Label htmlFor="search" className="text-sm font-medium">搜索</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            id="search"
            placeholder="搜索用户名、邮箱或姓名..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      
      <div className="w-full sm:w-40">
        <Label htmlFor="role" className="text-sm font-medium">角色</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger id="role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有角色</SelectItem>
            <SelectItem value="admin">管理员</SelectItem>
            <SelectItem value="seller">卖家</SelectItem>
            <SelectItem value="user">普通用户</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="w-full sm:w-40">
        <Label htmlFor="status" className="text-sm font-medium">状态</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有状态</SelectItem>
            <SelectItem value="verified">已验证</SelectItem>
            <SelectItem value="unverified">未验证</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

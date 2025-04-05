
import { ProfileDomain } from "@/types/userProfile";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Eye, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";

interface DomainTableProps {
  domains: ProfileDomain[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export const DomainTable = ({ 
  domains, 
  isLoading = false, 
  emptyMessage = "没有域名"
}: DomainTableProps) => {
  if (isLoading) {
    return <div className="text-center py-8">加载中...</div>;
  }
  
  if (domains.length === 0) {
    return <div className="text-center py-8 text-gray-500">{emptyMessage}</div>;
  }
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>域名</TableHead>
            <TableHead>类别</TableHead>
            <TableHead>价格</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {domains.map((domain) => (
            <TableRow key={domain.id}>
              <TableCell className="font-medium">{domain.name}</TableCell>
              <TableCell>
                {domain.category ? (
                  <Badge variant="secondary" className="text-xs">
                    {domain.category}
                  </Badge>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell>
                {domain.price !== undefined ? `¥${domain.price.toLocaleString()}` : "-"}
              </TableCell>
              <TableCell>
                {domain.status === "available" ? (
                  <Badge variant="default">
                    在售
                  </Badge>
                ) : domain.status === "sold" ? (
                  <Badge variant="secondary" className="bg-gray-200 text-gray-800">
                    已售
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    {domain.status}
                  </Badge>
                )}
                {domain.is_verified && (
                  <Badge variant="verified" className="ml-2">
                    <ShieldCheck className="h-3 w-3 mr-1" /> 已验证
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Link to={`/domain/${domain.id}`}>
                    <Button variant="outline" size="sm" className="h-8">
                      <Eye className="h-3.5 w-3.5 mr-1" /> 查看
                    </Button>
                  </Link>
                  <a href={`http://${domain.name}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" className="h-8">
                      <ExternalLink className="h-3.5 w-3.5 mr-1" /> 访问
                    </Button>
                  </a>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

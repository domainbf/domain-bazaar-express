
import { ProfileDomain } from "@/types/userProfile";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, ExternalLink, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

interface DomainGridProps {
  domains: ProfileDomain[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export const DomainGrid = ({ 
  domains, 
  isLoading = false, 
  emptyMessage = "没有域名"
}: DomainGridProps) => {
  if (isLoading) {
    return <div className="text-center py-8">加载中...</div>;
  }
  
  if (domains.length === 0) {
    return <div className="text-center py-8 text-gray-500">{emptyMessage}</div>;
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {domains.map((domain) => (
        <Card key={domain.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold truncate">{domain.name}</h3>
                {domain.category && (
                  <Badge variant="secondary" className="mt-1">
                    {domain.category}
                  </Badge>
                )}
              </div>
              {domain.is_verified && (
                <Badge variant="verified" className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> 已验证
                </Badge>
              )}
            </div>
            
            {domain.price !== undefined && (
              <div className="mt-2 text-lg font-semibold">
                ¥{domain.price.toLocaleString()}
              </div>
            )}
            
            {domain.description && (
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                {domain.description}
              </p>
            )}
            
            <div className="mt-4 flex justify-between">
              <Link to={`/domain/${domain.id}`}>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Eye className="h-4 w-4" /> 查看详情
                </Button>
              </Link>
              
              <a href={`http://${domain.name}`} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  <ExternalLink className="h-4 w-4" /> 访问
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

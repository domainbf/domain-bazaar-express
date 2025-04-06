
import { ProfileDomain } from "@/types/userProfile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

interface DomainTableProps {
  domains: ProfileDomain[];
}

export const DomainTable = ({ domains }: DomainTableProps) => {
  const getCategoryLabel = (category?: string) => {
    switch(category) {
      case 'standard': return '标准';
      case 'premium': return '高级';
      case 'short': return '短域名';
      case 'dev': return '开发';
      case 'brandable': return '品牌';
      default: return category;
    }
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4">域名</th>
            <th className="text-left py-3 px-4">分类</th>
            <th className="text-left py-3 px-4">状态</th>
            <th className="text-right py-3 px-4">价格</th>
            <th className="text-right py-3 px-4"></th>
          </tr>
        </thead>
        <tbody>
          {domains.map(domain => (
            <tr key={domain.id} className="border-b hover:bg-gray-50">
              <td className="py-3 px-4">
                <div className="flex items-center">
                  <span className="font-mono">{domain.name}</span>
                  {domain.highlight && (
                    <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                      精选
                    </Badge>
                  )}
                </div>
              </td>
              <td className="py-3 px-4">
                {domain.category && (
                  <Badge variant="outline">
                    {getCategoryLabel(domain.category)}
                  </Badge>
                )}
              </td>
              <td className="py-3 px-4">
                <Badge 
                  variant={domain.status === 'available' ? 'default' : 'secondary'}
                  className={domain.status === 'available' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
                >
                  {domain.status === 'available' ? '在售' : '已售出'}
                </Badge>
              </td>
              <td className="py-3 px-4 text-right font-bold">
                ¥{domain.price.toLocaleString()}
              </td>
              <td className="py-3 px-4 text-right">
                <Link to={`/marketplace?domain=${domain.name}`}>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    查看详情
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

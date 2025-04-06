
import { ProfileDomain } from "@/types/userProfile";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

interface DomainGridProps {
  domains: ProfileDomain[];
}

export const DomainGrid = ({ domains }: DomainGridProps) => {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {domains.map(domain => (
        <Card key={domain.id} className="h-full flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="font-mono text-lg">{domain.name}</CardTitle>
              {domain.highlight && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                  精选
                </Badge>
              )}
            </div>
            {domain.category && (
              <Badge variant="outline" className="mt-1">
                {getCategoryLabel(domain.category)}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-gray-600 text-sm h-16 overflow-hidden">
              {domain.description || '没有描述'}
            </p>
          </CardContent>
          <CardFooter className="flex justify-between items-center pt-2 border-t">
            <div className="font-bold">¥{domain.price.toLocaleString()}</div>
            <Link to={`/marketplace?domain=${domain.name}`}>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                查看详情
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

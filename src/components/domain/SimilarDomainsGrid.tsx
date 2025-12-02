
import React from 'react';
import { Domain } from '@/types/domain';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SimilarDomainsGridProps {
  domains: Domain[];
}

export const SimilarDomainsGrid: React.FC<SimilarDomainsGridProps> = ({ domains }) => {
  const navigate = useNavigate();

  if (!domains || domains.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>暂无相似域名推荐</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {domains.map((domain) => (
        <Card key={domain.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div>
                <h3 className="font-bold text-2xl md:text-3xl tracking-tight uppercase truncate">
                  {domain.name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {domain.description || '暂无描述'}
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">{domain.category}</Badge>
                <div className="text-right">
                  <div className="font-bold text-lg text-primary">
                    ¥{domain.price.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {domain.views || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    0
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/domain/${domain.name}`)}
                >
                  查看详情
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

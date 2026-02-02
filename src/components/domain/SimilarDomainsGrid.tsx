import React from 'react';
import { Domain } from '@/types/domain';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Heart, TrendingUp, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface SimilarDomainsGridProps {
  domains: Domain[];
  currentDomainName?: string;
}

// 计算相似度分数
const calculateSimilarity = (domain1: string, domain2: string): number => {
  const name1 = domain1.split('.')[0].toLowerCase();
  const name2 = domain2.split('.')[0].toLowerCase();
  
  // 长度相似度
  const lengthDiff = Math.abs(name1.length - name2.length);
  const lengthScore = Math.max(0, 100 - lengthDiff * 10);
  
  // 字符相似度
  const chars1 = new Set(name1.split(''));
  const chars2 = new Set(name2.split(''));
  const commonChars = [...chars1].filter(c => chars2.has(c)).length;
  const charScore = (commonChars / Math.max(chars1.size, chars2.size)) * 100;
  
  // 后缀相似度
  const ext1 = domain1.split('.').slice(1).join('.');
  const ext2 = domain2.split('.').slice(1).join('.');
  const extScore = ext1 === ext2 ? 100 : 50;
  
  return Math.round((lengthScore * 0.3 + charScore * 0.5 + extScore * 0.2));
};

export const SimilarDomainsGrid: React.FC<SimilarDomainsGridProps> = ({ 
  domains,
  currentDomainName 
}) => {
  const navigate = useNavigate();

  if (!domains || domains.length === 0) {
    return null;
  }

  // 按相似度排序
  const sortedDomains = currentDomainName 
    ? [...domains].sort((a, b) => 
        calculateSimilarity(b.name, currentDomainName) - calculateSimilarity(a.name, currentDomainName)
      )
    : domains;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {sortedDomains.slice(0, 6).map((domain, index) => {
        const similarity = currentDomainName 
          ? calculateSimilarity(domain.name, currentDomainName) 
          : null;
        
        return (
          <motion.div
            key={domain.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group"
          >
            <div 
              className="p-4 border rounded-xl bg-card hover:shadow-md transition-all duration-300 cursor-pointer hover:border-primary/30"
              onClick={() => navigate(`/domain/${domain.name}`)}
            >
              <div className="space-y-3">
                {/* 相似度和验证标签 */}
                <div className="flex items-center justify-between gap-2">
                  {similarity && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        similarity >= 70 
                          ? 'bg-green-50 text-green-600 border-green-200' 
                          : similarity >= 50 
                            ? 'bg-blue-50 text-blue-600 border-blue-200'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      {similarity}% 相似
                    </Badge>
                  )}
                  {domain.is_verified && (
                    <Badge className="bg-green-500/10 text-green-600 border-green-200 text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      已验证
                    </Badge>
                  )}
                </div>

                {/* 域名名称 */}
                <h3 className="font-bold text-lg sm:text-xl tracking-tight uppercase truncate group-hover:text-primary transition-colors">
                  {domain.name}
                </h3>
                
                {/* 价格和分类 */}
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-xs capitalize shrink-0">
                    {domain.category || 'standard'}
                  </Badge>
                  <div className="font-bold text-primary flex items-center">
                    ¥{domain.price.toLocaleString()}
                    {domain.highlight && (
                      <TrendingUp className="h-4 w-4 ml-1 text-orange-500" />
                    )}
                  </div>
                </div>

                {/* 统计 */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {domain.views || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {domain.favorites || 0}
                    </span>
                  </div>
                  <span className="text-primary font-medium group-hover:underline">
                    查看 →
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

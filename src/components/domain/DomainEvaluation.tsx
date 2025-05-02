
import React, { useState } from 'react';
import { useDomainEvaluation } from '@/hooks/useDomainEvaluation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gauge, TrendingUp, Zap, Scale, List, InfoIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface DomainEvaluationProps {
  initialDomain?: string;
}

export const DomainEvaluation = ({ initialDomain }: DomainEvaluationProps) => {
  const [domainName, setDomainName] = useState(initialDomain || '');
  const { estimate, isLoading, evaluateDomain } = useDomainEvaluation(initialDomain);
  const isMobile = useIsMobile();
  
  const handleEvaluate = () => {
    if (!domainName) {
      toast.error('请输入域名');
      return;
    }
    
    // Simple domain name validation
    if (!validateDomainName(domainName)) {
      toast.error('请输入有效的域名');
      return;
    }
    
    evaluateDomain(domainName);
  };
  
  // Basic domain name validation
  const validateDomainName = (name: string): boolean => {
    // Simple regex for domain names
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    return domainRegex.test(name);
  };
  
  // Get impact level description and color
  const getImpactDetails = (level: number) => {
    switch (level) {
      case 5:
        return { text: '极高', color: 'text-green-600', bgColor: 'bg-green-600' };
      case 4:
        return { text: '高', color: 'text-green-500', bgColor: 'bg-green-500' };
      case 3:
        return { text: '中等', color: 'text-yellow-500', bgColor: 'bg-yellow-500' };
      case 2:
        return { text: '低', color: 'text-orange-500', bgColor: 'bg-orange-500' };
      case 1:
        return { text: '极低', color: 'text-red-500', bgColor: 'bg-red-500' };
      default:
        return { text: '未知', color: 'text-gray-500', bgColor: 'bg-gray-500' };
    }
  };
  
  // Format price for display
  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    });
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-6 w-6" />
            域名价值评估
          </CardTitle>
          <CardDescription>
            输入任意域名，获取其估值范围和潜力分析
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-2">
            <Input 
              placeholder="输入域名 (例如: example.com)" 
              value={domainName}
              onChange={(e) => setDomainName(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleEvaluate} 
              disabled={isLoading || !domainName}
              className="md:w-auto w-full"
            >
              {isLoading ? '评估中...' : '评估价值'}
            </Button>
          </div>
          
          {isLoading && (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          )}
          
          {!isLoading && estimate && (
            <div className="mt-6 space-y-6">
              <div className="border rounded-lg p-6 bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-gray-500">估值范围</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-bold">
                        {formatPrice(estimate.min_price)}
                      </span>
                      <span className="text-gray-500 mx-2">-</span>
                      <span className="text-3xl font-bold">
                        {formatPrice(estimate.max_price)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2">
                      <span className="text-sm text-gray-500">准确度</span>
                      <Badge 
                        variant="outline" 
                        className={`font-medium ${
                          estimate.confidence_score > 80 
                            ? 'border-green-500 text-green-600' 
                            : estimate.confidence_score > 60 
                              ? 'border-yellow-500 text-yellow-600' 
                              : 'border-orange-500 text-orange-600'
                        }`}
                      >
                        {estimate.confidence_score}%
                      </Badge>
                    </div>
                    <Progress 
                      value={estimate.confidence_score} 
                      className="h-2 w-full md:w-40 mt-2" 
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  影响因素
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {estimate.factors.map((factor, index) => {
                    const impact = getImpactDetails(factor.impact);
                    return (
                      <Card key={index} className="overflow-hidden">
                        <div className={`h-1 ${impact.bgColor}`}></div>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{factor.name}</h4>
                              <p className="text-sm text-gray-500 mt-1">{factor.description}</p>
                            </div>
                            <Badge variant="outline" className={`${impact.color} border-current`}>
                              {impact.text}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
              
              {estimate.similar_domains && estimate.similar_domains.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                    <List className="h-5 w-5" />
                    类似域名市场价
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 font-medium text-gray-500">域名</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-500">价格</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estimate.similar_domains.map((domain, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-2 px-3">{domain.name}</td>
                            <td className="py-2 px-3 text-right font-medium">
                              {formatPrice(domain.price)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
                <InfoIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  域名估值基于多种因素，包括长度、组成、TLD和市场对比。这仅作为参考，实际价值可能因市场变化、行业趋势及买卖双方谈判而不同。
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

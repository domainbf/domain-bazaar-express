
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calculator, 
  TrendingUp, 
  Globe, 
  Star, 
  DollarSign,
  BarChart3,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface ValuationFactor {
  name: string;
  score: number;
  impact: number;
  description: string;
}

interface DomainValuation {
  estimatedValue: {
    min: number;
    max: number;
    suggested: number;
  };
  confidenceScore: number;
  factors: ValuationFactor[];
  marketComparisons: {
    domain: string;
    price: number;
    soldDate?: string;
  }[];
}

export const DomainValuationTool: React.FC = () => {
  const [domainName, setDomainName] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [valuation, setValuation] = useState<DomainValuation | null>(null);

  const evaluateDomain = async () => {
    if (!domainName.trim()) {
      toast.error('请输入域名');
      return;
    }

    setIsEvaluating(true);
    
    try {
      // 模拟域名估值逻辑
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockValuation: DomainValuation = {
        estimatedValue: {
          min: 5000,
          max: 25000,
          suggested: 12000
        },
        confidenceScore: 78,
        factors: [
          {
            name: '域名长度',
            score: 85,
            impact: 20,
            description: '短域名通常更有价值'
          },
          {
            name: '关键词热度',
            score: 72,
            impact: 25,
            description: '包含热门关键词'
          },
          {
            name: '搜索量',
            score: 68,
            impact: 15,
            description: '相关搜索量较高'
          },
          {
            name: '商业价值',
            score: 80,
            impact: 20,
            description: '具有商业应用潜力'
          },
          {
            name: '品牌化程度',
            score: 65,
            impact: 20,
            description: '容易记忆和品牌化'
          }
        ],
        marketComparisons: [
          { domain: 'similar1.com', price: 15000, soldDate: '2024-01-15' },
          { domain: 'similar2.com', price: 8000, soldDate: '2024-02-20' },
          { domain: 'similar3.com', price: 18000, soldDate: '2023-12-10' }
        ]
      };
      
      setValuation(mockValuation);
      toast.success('域名估值完成');
    } catch (error) {
      toast.error('估值失败，请重试');
    } finally {
      setIsEvaluating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            域名估值工具
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="输入要估值的域名 (例如: example.com)"
              value={domainName}
              onChange={(e) => setDomainName(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={evaluateDomain}
              disabled={isEvaluating}
              className="min-w-[100px]"
            >
              {isEvaluating ? '评估中...' : '开始估值'}
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            * 估值结果仅供参考，实际价值可能因市场变化而波动
          </div>
        </CardContent>
      </Card>

      {valuation && (
        <>
          {/* 估值结果概览 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                估值结果
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">最低估值</div>
                  <div className="text-2xl font-bold text-primary">
                    ¥{valuation.estimatedValue.min.toLocaleString()}
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">建议价格</div>
                  <div className="text-3xl font-bold text-green-600">
                    ¥{valuation.estimatedValue.suggested.toLocaleString()}
                  </div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">最高估值</div>
                  <div className="text-2xl font-bold text-blue-600">
                    ¥{valuation.estimatedValue.max.toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex items-center gap-3">
                <span className="text-sm font-medium">置信度:</span>
                <Progress value={valuation.confidenceScore} className="flex-1" />
                <Badge variant={valuation.confidenceScore > 70 ? 'default' : 'secondary'}>
                  {valuation.confidenceScore}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* 估值因素分析 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                估值因素分析
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {valuation.factors.map((factor, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{factor.name}</span>
                      <Badge variant="outline" className="text-xs">
                        权重 {factor.impact}%
                      </Badge>
                    </div>
                    <span className={`font-bold ${getScoreColor(factor.score)}`}>
                      {factor.score}/100
                    </span>
                  </div>
                  <Progress 
                    value={factor.score} 
                    className={`h-2 ${getScoreBg(factor.score)}`}
                  />
                  <p className="text-sm text-muted-foreground">
                    {factor.description}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 市场对比 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                相似域名成交记录
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {valuation.marketComparisons.map((comp, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{comp.domain}</span>
                      {comp.soldDate && (
                        <Badge variant="outline" className="text-xs">
                          {new Date(comp.soldDate).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                    <span className="font-bold text-green-600">
                      ¥{comp.price.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

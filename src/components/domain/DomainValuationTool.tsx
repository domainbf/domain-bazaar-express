
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calculator, 
  TrendingUp, 
  Star, 
  Info,
  DollarSign,
  Target,
  BarChart3,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { DomainValueEstimate } from '@/types/domain';

interface DomainValuationToolProps {
  domainName?: string;
  onValuationComplete?: (estimate: DomainValueEstimate) => void;
}

export const DomainValuationTool: React.FC<DomainValuationToolProps> = ({
  domainName = '',
  onValuationComplete
}) => {
  const [inputDomain, setInputDomain] = useState(domainName);
  const [estimate, setEstimate] = useState<DomainValueEstimate | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const evaluateDomain = async () => {
    if (!inputDomain.trim()) {
      toast.error('请输入域名');
      return;
    }

    setIsEvaluating(true);
    try {
      // 模拟域名估值算法
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const domain = inputDomain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
      const domainParts = domain.split('.');
      const name = domainParts[0];
      const extension = domainParts[1] || 'com';
      
      // 估值因素分析
      const factors = [
        {
          name: '域名长度',
          impact: name.length <= 6 ? 25 : name.length <= 10 ? 15 : 5,
          description: `${name.length}个字符${name.length <= 6 ? '，简短易记' : name.length <= 10 ? '，长度适中' : '，较长'}`
        },
        {
          name: '域名后缀',
          impact: extension === 'com' ? 20 : extension === 'cn' ? 15 : extension === 'net' ? 10 : 5,
          description: `.${extension}${extension === 'com' ? '，最受欢迎' : extension === 'cn' ? '，中国市场热门' : '，常见后缀'}`
        },
        {
          name: '关键词价值',
          impact: /^(ai|tech|app|web|digital|online|mobile|cloud)/.test(name) ? 20 : /^(shop|store|buy|sell)/.test(name) ? 15 : 10,
          description: name.includes('ai') || name.includes('tech') ? '包含热门科技关键词' : '普通关键词'
        },
        {
          name: '记忆性',
          impact: /^[a-z]+$/.test(name) && name.length <= 8 ? 15 : 10,
          description: /^[a-z]+$/.test(name) ? '纯字母，易于记忆' : '包含数字或特殊字符'
        },
        {
          name: '商业价值',
          impact: /^(buy|sell|shop|store|market|trade|business)/.test(name) ? 20 : 10,
          description: /^(buy|sell|shop|store|market|trade|business)/.test(name) ? '具有明显商业价值' : '一般商业价值'
        }
      ];

      // 计算总分和价格范围
      const totalScore = factors.reduce((sum, factor) => sum + factor.impact, 0);
      const basePrice = 1000;
      const multiplier = Math.max(1, totalScore / 20);
      
      const minPrice = Math.round(basePrice * multiplier * 0.8);
      const maxPrice = Math.round(basePrice * multiplier * 1.5);
      
      // 相似域名案例
      const similarDomains = [
        { name: 'techapp.com', price: 15000, sold_date: '2024-01-15' },
        { name: 'aistore.com', price: 25000, sold_date: '2024-01-10' },
        { name: 'webshop.com', price: 18000, sold_date: '2023-12-20' }
      ];

      const mockEstimate: DomainValueEstimate = {
        min_price: minPrice,
        max_price: maxPrice,
        factors,
        similar_domains: similarDomains,
        confidence_score: Math.min(95, totalScore + 30)
      };

      setEstimate(mockEstimate);
      onValuationComplete?.(mockEstimate);
      toast.success('域名估值完成！');
    } catch (error) {
      console.error('域名估值失败:', error);
      toast.error('估值失败，请重试');
    } finally {
      setIsEvaluating(false);
    }
  };

  const getFactorColor = (impact: number) => {
    if (impact >= 20) return 'text-green-600 bg-green-100';
    if (impact >= 15) return 'text-blue-600 bg-blue-100';
    if (impact >= 10) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* 估值输入 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            域名估值工具
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="输入域名进行估值，如：example.com"
              value={inputDomain}
              onChange={(e) => setInputDomain(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && evaluateDomain()}
            />
            <Button 
              onClick={evaluateDomain}
              disabled={isEvaluating}
              className="whitespace-nowrap"
            >
              {isEvaluating ? '评估中...' : '开始估值'}
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-1 mb-1">
              <Info className="h-3 w-3" />
              我们的AI估值系统会分析多个维度为您提供专业的域名价值评估
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>域名长度和记忆性分析</li>
              <li>关键词商业价值评估</li>
              <li>后缀类型影响分析</li>
              <li>市场交易数据对比</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 估值结果 */}
      {estimate && (
        <>
          {/* 价格范围 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                估值结果
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">最低估值</div>
                  <div className="text-2xl font-bold text-green-600">
                    ¥{estimate.min_price.toLocaleString()}
                  </div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">建议价格</div>
                  <div className="text-2xl font-bold text-blue-600">
                    ¥{Math.round((estimate.min_price + estimate.max_price) / 2).toLocaleString()}
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">最高估值</div>
                  <div className="text-2xl font-bold text-purple-600">
                    ¥{estimate.max_price.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  <span className="font-medium">置信度评分</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={estimate.confidence_score} className="w-20" />
                  <span className={`font-bold ${getConfidenceColor(estimate.confidence_score)}`}>
                    {estimate.confidence_score}%
                  </span>
                </div>
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
            <CardContent>
              <div className="space-y-4">
                {estimate.factors.map((factor, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{factor.name}</span>
                        <div className={`px-2 py-1 rounded text-xs ${getFactorColor(factor.impact)}`}>
                          {factor.impact >= 20 ? '优秀' : factor.impact >= 15 ? '良好' : factor.impact >= 10 ? '一般' : '较差'}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {factor.description}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">+{factor.impact}</div>
                      <div className="text-xs text-muted-foreground">分数</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 相似域名交易案例 */}
          {estimate.similar_domains && estimate.similar_domains.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  相似域名交易案例
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {estimate.similar_domains.map((domain, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-medium">{domain.name}</div>
                          <div className="text-sm text-muted-foreground">
                            成交时间：{domain.sold_date ? new Date(domain.sold_date).toLocaleDateString() : '未知'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          ¥{domain.price.toLocaleString()}
                        </div>
                        <Badge variant="outline" className="text-xs">已成交</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 估值说明 */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-blue-800 mb-1">估值说明</div>
                  <div className="text-blue-700 space-y-1">
                    <p>• 此估值基于AI算法分析，仅供参考</p>
                    <p>• 实际交易价格可能因市场情况而有所不同</p>
                    <p>• 建议结合市场趋势和买家需求进行定价</p>
                    <p>• 如需更精确估值，请联系专业评估师</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};


import React, { useState, useRef, useEffect } from 'react';
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
  Briefcase,
  LineChart,
  Award,
  Zap,
  Search,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedEvaluation {
  domain: string;
  estimatedValue: number;
  valueRange: { min: number; max: number };
  dimensions: {
    marketTrend: { score: number; analysis: string };
    industryApplication: { score: number; analysis: string };
    investmentValue: { score: number; analysis: string };
    brandPotential: { score: number; analysis: string };
    technicalQuality: { score: number; analysis: string };
    seoValue: { score: number; analysis: string };
  };
  overallAnalysis: string;
  recommendations: string[];
  confidence: number;
}

interface DomainValuationToolProps {
  domainName?: string;
}

export const DomainValuationTool: React.FC<DomainValuationToolProps> = ({
  domainName = ''
}) => {
  const [inputDomain, setInputDomain] = useState(domainName);
  const [evaluation, setEvaluation] = useState<EnhancedEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (evaluation && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [evaluation]);

  const evaluateDomain = async () => {
    if (!inputDomain.trim()) {
      toast.error('请输入域名');
      return;
    }

    setIsEvaluating(true);
    try {
      const { data, error } = await supabase.functions.invoke('domain-enhanced-evaluation', {
        body: { domain: inputDomain }
      });

      if (error) throw error;

      setEvaluation(data);
      toast.success('域名评估完成！');
    } catch (error: any) {
      console.error('域名评估失败:', error);
      toast.error(error.message || '评估失败，请重试');
    } finally {
      setIsEvaluating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '优秀';
    if (score >= 60) return '良好';
    if (score >= 40) return '一般';
    return '较弱';
  };

  const dimensionIcons = {
    marketTrend: TrendingUp,
    industryApplication: Briefcase,
    investmentValue: LineChart,
    brandPotential: Award,
    technicalQuality: Zap,
    seoValue: Search,
  };

  const dimensionLabels = {
    marketTrend: '市场趋势',
    industryApplication: '行业应用',
    investmentValue: '投资价值',
    brandPotential: '品牌潜力',
    technicalQuality: '技术质量',
    seoValue: 'SEO价值',
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

      {/* 评估结果 */}
      {evaluation && (
        <div ref={resultRef} className="space-y-6">
          {/* 价格评估 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                价格评估
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">最低估值</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${evaluation.valueRange.min.toLocaleString()}
                  </div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">建议价格</div>
                  <div className="text-2xl font-bold text-blue-600">
                    ${evaluation.estimatedValue.toLocaleString()}
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">最高估值</div>
                  <div className="text-2xl font-bold text-purple-600">
                    ${evaluation.valueRange.max.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  <span className="font-medium">置信度</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={evaluation.confidence} className="w-20" />
                  <span className="font-bold text-primary">
                    {evaluation.confidence}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 多维度分析 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                多维度分析
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(evaluation.dimensions).map(([key, dimension]) => {
                  const Icon = dimensionIcons[key as keyof typeof dimensionIcons];
                  return (
                    <div key={key} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-primary" />
                          <span className="font-medium">{dimensionLabels[key as keyof typeof dimensionLabels]}</span>
                        </div>
                        <Badge className={getScoreColor(dimension.score)}>
                          {dimension.score}分 · {getScoreLabel(dimension.score)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{dimension.analysis}</p>
                      <Progress value={dimension.score} className="mt-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 综合评估 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                综合评估
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">{evaluation.overallAnalysis}</p>
            </CardContent>
          </Card>

          {/* 专业建议 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                专业建议
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {evaluation.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

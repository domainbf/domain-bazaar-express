
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Globe, 
  Star, 
  AlertCircle, 
  RefreshCw,
  Briefcase,
  LineChart,
  Award,
  Zap,
  Search,
  CheckCircle,
  BarChart3,
  Info
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

export const DomainEstimator = () => {
  const [domain, setDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EnhancedEvaluation | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  const estimateDomain = async () => {
    if (!domain.trim()) {
      toast.error('请输入域名');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('domain-enhanced-evaluation', {
        body: { domain }
      });

      if (error) throw error;

      setResult(data);
      toast.success('域名评估完成');
    } catch (error: any) {
      console.error('评估失败:', error);
      toast.error('评估失败：' + (error.message || '未知错误'));
    } finally {
      setIsLoading(false);
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">域名价值评估</h2>
        <p className="text-gray-600">基于多维度算法的专业域名价值评估</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            智能域名评估
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Input
              placeholder="请输入域名，如: example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && estimateDomain()}
              className="flex-1"
            />
            <Button onClick={estimateDomain} disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  评估中...
                </>
              ) : (
                '开始评估'
              )}
            </Button>
          </div>

          {result && (
            <div ref={resultRef} className="space-y-6">
              <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <h3 className="text-2xl font-bold text-foreground mb-2">{result.domain}</h3>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-3xl font-bold text-green-600">${result.estimatedValue.toLocaleString('en-US')}</span>
                </div>
                <p className="text-muted-foreground">估算价值（USD）· 置信度: {result.confidence}%</p>
                <Progress value={result.confidence} className="w-full max-w-xs mx-auto mt-2" />
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-3 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  多维度分析
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(result.dimensions).map(([key, dimension]) => {
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
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2 flex items-center">
                  <Star className="w-4 h-4 mr-2" />
                  综合评估
                </h4>
                <p className="text-foreground leading-relaxed">{result.overallAnalysis}</p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-3 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  专业建议
                </h4>
                <ul className="space-y-2">
                  {result.recommendations.map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-center">
                <Button onClick={() => setResult(null)} variant="outline">
                  重新评估
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

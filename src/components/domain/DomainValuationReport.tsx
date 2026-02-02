import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  RefreshCw, 
  Briefcase, 
  LineChart, 
  Award, 
  Zap, 
  Search,
  FileText,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DomainValuationReportProps {
  domainName: string;
  currentPrice: number;
}

interface ValuationResult {
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

export const DomainValuationReport: React.FC<DomainValuationReportProps> = ({ 
  domainName, 
  currentPrice 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ValuationResult | null>(null);

  const runValuation = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('domain-enhanced-evaluation', {
        body: { domain: domainName }
      });

      if (error) throw error;
      setResult(data);
      toast.success('估值报告生成成功');
    } catch (error: any) {
      console.error('估值失败:', error);
      toast.error('估值失败：' + (error.message || '未知错误'));
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getPriceComparison = () => {
    if (!result) return null;
    const diff = ((result.estimatedValue - currentPrice) / currentPrice) * 100;
    
    if (diff > 10) {
      return (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg text-sm">
          <TrendingUp className="h-4 w-4 shrink-0" />
          <span className="font-medium">当前定价偏低 {diff.toFixed(0)}%，建议适当提价</span>
        </div>
      );
    } else if (diff < -10) {
      return (
        <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="font-medium">当前定价偏高 {Math.abs(diff).toFixed(0)}%，可能影响成交</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-2 rounded-lg text-sm">
        <CheckCircle className="h-4 w-4 shrink-0" />
        <span className="font-medium">当前定价合理，与市场估值相符</span>
      </div>
    );
  };

  const dimensionConfig = {
    marketTrend: { icon: TrendingUp, label: '市场趋势' },
    industryApplication: { icon: Briefcase, label: '行业应用' },
    investmentValue: { icon: LineChart, label: '投资价值' },
    brandPotential: { icon: Award, label: '品牌潜力' },
    technicalQuality: { icon: Zap, label: '技术质量' },
    seoValue: { icon: Search, label: 'SEO价值' },
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-muted-foreground mb-4">
          点击按钮生成专业的域名估值报告，了解域名的真实市场价值
        </p>
        <Button onClick={runValuation} variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          生成估值报告
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 刷新按钮 */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={runValuation} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          重新估值
        </Button>
      </div>

      {/* 估值摘要 */}
      <div className="text-center p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border">
        <h3 className="text-base font-medium text-muted-foreground mb-2">估算市场价值</h3>
        <div className="text-3xl sm:text-4xl font-black text-foreground mb-2">
          ${result.estimatedValue.toLocaleString('en-US')}
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          价值区间: ${result.valueRange.min.toLocaleString()} - ${result.valueRange.max.toLocaleString()}
        </p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground">置信度:</span>
          <Progress value={result.confidence} className="w-24 h-2" />
          <span className="text-sm font-medium">{result.confidence}%</span>
        </div>
      </div>

      {/* 价格对比 */}
      {getPriceComparison()}

      {/* 多维度分析 */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
          <Info className="h-4 w-4" />
          多维度分析
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(result.dimensions).map(([key, dimension]) => {
            const config = dimensionConfig[key as keyof typeof dimensionConfig];
            const Icon = config.icon;
            return (
              <div key={key} className="p-3 border rounded-lg hover:shadow-sm transition-shadow bg-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{config.label}</span>
                  </div>
                  <Badge className={`text-xs border ${getScoreColor(dimension.score)}`}>
                    {dimension.score}分
                  </Badge>
                </div>
                <Progress value={dimension.score} className="h-1.5 mb-2" />
                <p className="text-xs text-muted-foreground line-clamp-2">{dimension.analysis}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 综合评估 */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <h4 className="font-semibold mb-2 text-foreground">综合评估</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{result.overallAnalysis}</p>
      </div>

      {/* 专业建议 */}
      <div>
        <h4 className="font-semibold mb-2 text-foreground">专业建议</h4>
        <ul className="space-y-2">
          {result.recommendations.map((rec, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <span className="text-muted-foreground">{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

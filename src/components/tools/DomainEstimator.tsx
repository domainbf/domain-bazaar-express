
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Globe, Star, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAppCache } from '@/hooks/useAppCache';

interface EstimationResult {
  domain: string;
  estimatedValue: number;
  factors: {
    length: number;
    extension: number;
    keywords: number;
    brandability: number;
    seo: number;
  };
  category: 'premium' | 'standard' | 'basic';
  suggestions: string[];
  confidence: number;
}

export const DomainEstimator = () => {
  const [domain, setDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EstimationResult | null>(null);

  // 高级域名评估算法
  const evaluateDomain = async (domainName: string): Promise<EstimationResult> => {
    const cleanDomain = domainName.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
    const parts = cleanDomain.split('.');
    const name = parts[0];
    const extension = parts[parts.length - 1] || 'com';

    // 长度评分 (越短越好)
    const lengthScore = Math.min(100, Math.max(20, 100 - (name.length - 3) * 8));

    // 后缀评分
    const extensionScores: { [key: string]: number } = {
      'com': 100, 'net': 85, 'org': 80, 'cn': 90, 'io': 75,
      'co': 70, 'app': 65, 'tech': 60, 'online': 45, 'site': 40
    };
    const extensionScore = extensionScores[extension] || 30;

    // 关键词评分 (检查是否包含热门关键词)
    const hotKeywords = [
      'ai', 'tech', 'web', 'app', 'pay', 'shop', 'store', 'buy', 'sell',
      'crypto', 'blockchain', 'nft', 'cloud', 'data', 'smart', 'digital',
      'mobile', 'social', 'game', 'finance', 'health', 'education'
    ];
    const keywordMatches = hotKeywords.filter(kw => name.includes(kw));
    const keywordScore = Math.min(100, 50 + keywordMatches.length * 15);

    // 品牌化评分 (是否容易记忆和发音)
    const hasNumbers = /\d/.test(name);
    const hasHyphens = /-/.test(name);
    const isPronounceable = !/[^a-z0-9]/.test(name) && name.length <= 12;
    const brandabilityScore = Math.min(100, 
      70 + 
      (isPronounceable ? 15 : 0) + 
      (hasNumbers ? -10 : 10) + 
      (hasHyphens ? -15 : 5)
    );

    // SEO评分 (搜索引擎优化潜力)
    const commonWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all'];
    const hasCommonWords = commonWords.some(word => name.includes(word));
    const seoScore = Math.min(100,
      60 + 
      (keywordMatches.length * 10) +
      (name.length <= 15 ? 10 : 0) +
      (hasCommonWords ? -5 : 5)
    );

    const factors = {
      length: Math.round(lengthScore),
      extension: Math.round(extensionScore),
      keywords: Math.round(keywordScore),
      brandability: Math.round(brandabilityScore),
      seo: Math.round(seoScore)
    };

    const averageScore = Object.values(factors).reduce((sum, score) => sum + score, 0) / 5;
    const baseValue = Math.round(averageScore * 50 + Math.random() * 100); // 添加一些随机性

    // 确定类别
    let category: 'premium' | 'standard' | 'basic';
    if (averageScore >= 85) category = 'premium';
    else if (averageScore >= 65) category = 'standard';
    else category = 'basic';

    // 生成建议
    const suggestions = [];
    if (factors.length < 70) suggestions.push('域名较长，考虑使用更短的变体');
    if (factors.extension < 80) suggestions.push('考虑使用.com或.cn等主流后缀');
    if (factors.keywords < 70) suggestions.push('包含行业关键词可提升价值');
    if (factors.brandability < 70) suggestions.push('提高域名的易记性和品牌化程度');
    if (factors.seo < 70) suggestions.push('优化SEO相关因素');
    if (suggestions.length === 0) suggestions.push('域名质量良好，具有不错的投资价值');

    const confidence = Math.min(95, Math.max(60, averageScore));

    return {
      domain: cleanDomain,
      estimatedValue: baseValue,
      factors,
      category,
      suggestions,
      confidence: Math.round(confidence)
    };
  };

  // 缓存域名估值结果
  const cacheEstimation = async (estimation: EstimationResult) => {
    try {
      await supabase.from('domain_valuations').insert({
        domain_name: estimation.domain,
        estimated_value: estimation.estimatedValue,
        factors: estimation.factors,
        category: estimation.category
      });
    } catch (error) {
      console.error('Cache estimation error:', error);
      // 不抛出错误，缓存失败不应影响主功能
    }
  };

  // 获取缓存的估值
  const getCachedEstimation = async (domainName: string): Promise<EstimationResult | null> => {
    try {
      const { data, error } = await supabase
        .from('domain_valuations')
        .select('*')
        .eq('domain_name', domainName.toLowerCase())
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;

      return {
        domain: data.domain_name,
        estimatedValue: Number(data.estimated_value),
        factors: data.factors as any,
        category: data.category as any,
        suggestions: ['使用缓存的评估结果'],
        confidence: 85
      };
    } catch (error) {
      return null;
    }
  };

  const estimateDomain = async () => {
    if (!domain.trim()) {
      toast.error('请输入域名');
      return;
    }

    setIsLoading(true);
    
    try {
      // 首先检查缓存
      const cached = await getCachedEstimation(domain);
      if (cached) {
        setResult(cached);
        toast.success('加载缓存的评估结果');
        return;
      }

      // 进行新的评估
      const estimation = await evaluateDomain(domain);
      setResult(estimation);
      
      // 缓存结果
      await cacheEstimation(estimation);
      toast.success('域名评估完成');
    } catch (error: any) {
      console.error('Estimation error:', error);
      toast.error('评估失败：' + (error.message || '未知错误'));
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'premium': return 'bg-yellow-500';
      case 'standard': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'premium': return '优质域名';
      case 'standard': return '标准域名';
      default: return '基础域名';
    }
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
            <div className="space-y-6">
              <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{result.domain}</h3>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-3xl font-bold text-green-600">¥{result.estimatedValue.toLocaleString()}</span>
                  <Badge className={getCategoryColor(result.category)}>
                    {getCategoryText(result.category)}
                  </Badge>
                </div>
                <p className="text-gray-600">估算价值 (置信度: {result.confidence}%)</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{result.factors.length}</div>
                  <div className="text-sm text-gray-600">长度评分</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{result.factors.extension}</div>
                  <div className="text-sm text-gray-600">后缀评分</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{result.factors.keywords}</div>
                  <div className="text-sm text-gray-600">关键词评分</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{result.factors.brandability}</div>
                  <div className="text-sm text-gray-600">品牌化评分</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{result.factors.seo}</div>
                  <div className="text-sm text-gray-600">SEO评分</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  专业建议
                </h4>
                <ul className="space-y-2">
                  {result.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <Star className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{suggestion}</span>
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

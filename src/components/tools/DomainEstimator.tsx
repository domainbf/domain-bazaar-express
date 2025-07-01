
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Globe, Star, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface EstimationResult {
  domain: string;
  estimatedValue: number;
  factors: {
    length: number;
    extension: number;
    keywords: number;
    brandability: number;
  };
  category: 'premium' | 'standard' | 'basic';
  suggestions: string[];
}

export const DomainEstimator = () => {
  const [domain, setDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EstimationResult | null>(null);

  const estimateDomain = async () => {
    if (!domain.trim()) {
      toast.error('请输入域名');
      return;
    }

    setIsLoading(true);
    
    // 模拟域名评估逻辑
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 模拟API调用
      
      const domainName = domain.toLowerCase().replace(/\.(com|cn|net|org)$/, '');
      
      // 评估因子
      const lengthScore = domainName.length <= 5 ? 100 : domainName.length <= 8 ? 80 : domainName.length <= 12 ? 60 : 30;
      const extensionScore = domain.endsWith('.com') ? 100 : domain.endsWith('.cn') ? 80 : 60;
      const keywordScore = ['ai', 'tech', 'web', 'app', 'pay', 'shop'].some(kw => domainName.includes(kw)) ? 90 : 50;
      const brandabilityScore = /^[a-z]+$/.test(domainName) && domainName.length <= 8 ? 85 : 60;
      
      const averageScore = (lengthScore + extensionScore + keywordScore + brandabilityScore) / 4;
      const baseValue = Math.floor(averageScore * 100);
      
      const estimation: EstimationResult = {
        domain: domain,
        estimatedValue: baseValue,
        factors: {
          length: lengthScore,
          extension: extensionScore,
          keywords: keywordScore,
          brandability: brandabilityScore
        },
        category: averageScore >= 80 ? 'premium' : averageScore >= 60 ? 'standard' : 'basic',
        suggestions: [
          lengthScore < 60 ? '域名过长，简短域名更有价值' : '域名长度适中',
          extensionScore < 80 ? '考虑使用.com或.cn后缀' : '域名后缀优质',
          keywordScore < 70 ? '包含热门关键词可提升价值' : '包含有价值的关键词',
          brandabilityScore < 70 ? '提高品牌化程度' : '具有良好的品牌潜力'
        ]
      };
      
      setResult(estimation);
    } catch (error) {
      toast.error('评估失败，请重试');
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
        <p className="text-gray-600">输入域名获取专业的价值评估和建议</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            域名评估工具
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
              {isLoading ? '评估中...' : '开始评估'}
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
                <p className="text-gray-600">估算价值范围</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  评估建议
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

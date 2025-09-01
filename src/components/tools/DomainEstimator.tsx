
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
  description?: string; // AI-generated description
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
  const [comparables, setComparables] = useState<{ name: string; price: number }[]>([]);

  // 使用AI增强的域名评估算法
  const evaluateDomain = async (domainName: string): Promise<EstimationResult> => {
    try {
      // 调用AI评估Edge Function
      const response = await fetch('https://trqxaizkwuizuhlfmdup.supabase.co/functions/v1/domain-ai-evaluation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain: domainName })
      });

      if (!response.ok) {
        throw new Error('AI评估服务暂不可用，使用本地算法');
      }

      const aiResult = await response.json();
      
      // 查询相似域名
      const cleanDomain = domainName.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
      const parts = cleanDomain.split('.');
      const name = parts[0];
      
      try {
        const keyword = name.slice(0, Math.min(4, name.length));
        const { data } = await supabase
          .from('domain_listings')
          .select('name, price')
          .ilike('name', `%${keyword}%`)
          .limit(5);

        const comps = (data || []).map(d => ({ name: d.name as string, price: Number(d.price) }));
        setComparables(comps);
      } catch {}

      // 分类
      const avgScore = (aiResult.factors.length + aiResult.factors.extension + aiResult.factors.keywords + aiResult.factors.brandability + aiResult.factors.seo) / 5;
      let category: 'premium' | 'standard' | 'basic';
      if (avgScore >= 85 || aiResult.estimatedPrice >= 25000) category = 'premium';
      else if (avgScore >= 65 || aiResult.estimatedPrice >= 5000) category = 'standard';
      else category = 'basic';

      // 建议
      const suggestions: string[] = [];
      if (aiResult.factors.length < 70) suggestions.push('域名较长，考虑更短变体（≤10字符更佳）');
      if (aiResult.factors.extension < 80) suggestions.push('考虑使用 .com / .cn 等主流后缀以提升成交概率');
      if (aiResult.factors.keywords < 70) suggestions.push('可加入行业强相关关键词提升商业价值');
      if (aiResult.factors.brandability < 70) suggestions.push('提升易记性与读写性，避免连字符与重复字符');
      if (aiResult.factors.seo < 70) suggestions.push('可围绕核心关键词优化内容与外链，提升权重');
      if (suggestions.length === 0) suggestions.push('域名质量较好，建议结合市场需求灵活定价');

      return {
        domain: aiResult.domain,
        estimatedValue: aiResult.estimatedPrice,
        description: aiResult.description, // AI生成的描述
        factors: aiResult.factors,
        category,
        suggestions,
        confidence: aiResult.confidence
      };

    } catch (error) {
      console.error('AI评估失败，使用备用算法:', error);
      // 备用算法（原始算法）
      return await evaluateDomainFallback(domainName);
    }
  };

  // 备用域名评估算法
  const evaluateDomainFallback = async (domainName: string): Promise<EstimationResult> => {
    const cleanDomain = domainName.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
    const parts = cleanDomain.split('.')
    const name = parts[0]
    const extension = parts[parts.length - 1] || 'com'

    // 长度评分 (越短越好，2-4位溢价更高)
    const lengthScoreBase = name.length <= 2 ? 100 : name.length <= 4 ? 95 : name.length <= 6 ? 90 : name.length <= 10 ? 75 : 55

    // 后缀评分
    const extensionScores: { [key: string]: number } = {
      'com': 100, 'net': 85, 'org': 80, 'cn': 90, 'io': 80, 'ai': 85,
      'co': 75, 'app': 70, 'tech': 65, 'online': 50, 'site': 45
    }
    const extensionScore = extensionScores[extension] || 35

    // 关键词评分（热门行业加权）
    const hotKeywords = [
      'ai','tech','web','app','pay','shop','store','buy','sell','market','trade',
      'crypto','blockchain','nft','cloud','data','smart','digital','mobile','social','game',
      'finance','health','med','edu','edu','travel','bank','card','seo','ads'
    ]
    const keywordMatches = hotKeywords.filter(kw => name.includes(kw))
    const keywordScore = Math.min(100, 50 + keywordMatches.length * 18)

    // 品牌化评分
    const hasNumbers = /\d/.test(name)
    const hasHyphens = /-/.test(name)
    const isPronounceable = !/[^a-z0-9]/.test(name) && name.length <= 12
    const repeatedChars = /(.)\1{2,}/.test(name) ? -10 : 0
    const brandabilityScore = Math.max(40, Math.min(100,
      70 + (isPronounceable ? 15 : 0) + (hasNumbers ? -10 : 10) + (hasHyphens ? -15 : 5) + repeatedChars
    ))

    // SEO评分
    const commonWords = ['the','and','for','are','but','not','you','all']
    const hasCommonWords = commonWords.some(word => name.includes(word))
    const seoScore = Math.min(100, 60 + (keywordMatches.length * 10) + (name.length <= 15 ? 10 : 0) + (hasCommonWords ? -5 : 5))

    const factors = {
      length: Math.round(lengthScoreBase),
      extension: Math.round(extensionScore),
      keywords: Math.round(keywordScore),
      brandability: Math.round(brandabilityScore),
      seo: Math.round(seoScore)
    }

    // 基准估值（USD）
    let baseUSD = 800 + factors.length * 15 + factors.extension * 10 + factors.keywords * 8 + factors.brandability * 10 + factors.seo * 6

    // 短字符溢价
    if (name.length <= 4) baseUSD *= name.length === 2 ? 6 : name.length === 3 ? 3 : 1.7

    // TLD溢价
    if (extension === 'com') baseUSD *= 1.6
    if (['ai','io'].includes(extension)) baseUSD *= 1.2

    // 查询相似域名以校准估值
    try {
      const keyword = keywordMatches[0] || name.slice(0, Math.min(4, name.length))
      const { data } = await supabase
        .from('domain_listings')
        .select('name, price')
        .ilike('name', `%${keyword}%`)
        .limit(5)

      const comps = (data || []).map(d => ({ name: d.name as string, price: Number(d.price) }))
      setComparables(comps)
      if (comps.length) {
        const avg = comps.reduce((s, d) => s + d.price, 0) / comps.length
        // 市场校准，向市场均价靠近
        baseUSD = Math.round((baseUSD * 0.6) + (avg * 0.4))
      }
    } catch {}

    // 分类
    const avgScore = (factors.length + factors.extension + factors.keywords + factors.brandability + factors.seo) / 5
    let category: 'premium' | 'standard' | 'basic'
    if (avgScore >= 85 || baseUSD >= 25000) category = 'premium'
    else if (avgScore >= 65 || baseUSD >= 5000) category = 'standard'
    else category = 'basic'

    // 建议
    const suggestions: string[] = []
    if (factors.length < 70) suggestions.push('域名较长，考虑更短变体（≤10字符更佳）')
    if (factors.extension < 80) suggestions.push('考虑使用 .com / .cn 等主流后缀以提升成交概率')
    if (factors.keywords < 70) suggestions.push('可加入行业强相关关键词提升商业价值')
    if (factors.brandability < 70) suggestions.push('提升易记性与读写性，避免连字符与重复字符')
    if (factors.seo < 70) suggestions.push('可围绕核心关键词优化内容与外链，提升权重')
    if (suggestions.length === 0) suggestions.push('域名质量较好，建议结合市场需求灵活定价')

    const confidence = Math.min(95, Math.max(55, Math.round(avgScore)))

    return {
      domain: cleanDomain,
      estimatedValue: Math.max(300, Math.round(baseUSD)),
      factors,
      category,
      suggestions,
      confidence
    }
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
                  <span className="text-3xl font-bold text-green-600">${result.estimatedValue.toLocaleString('en-US')}</span>
                  <Badge className={getCategoryColor(result.category)}>
                    {getCategoryText(result.category)}
                  </Badge>
                </div>
                <p className="text-gray-600">估算价值（USD）(置信度: {result.confidence}%)</p>
                {result.description && (
                  <div className="mt-4 p-4 bg-white/70 rounded-lg">
                    <p className="text-sm text-gray-700 font-medium">AI专业评估</p>
                    <p className="text-gray-800 mt-1">{result.description}</p>
                  </div>
                )}
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

              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  相似域名（市场参考）
                </h4>
                {comparables.length === 0 ? (
                  <p className="text-sm text-muted-foreground">暂无相似域名参考</p>
                ) : (
                  <ul className="space-y-2">
                    {comparables.map((d, i) => (
                      <li key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="font-medium text-gray-900">{d.name}</span>
                        <span className="text-green-700 font-semibold">${d.price.toLocaleString('en-US')}</span>
                      </li>
                    ))}
                  </ul>
                )}
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

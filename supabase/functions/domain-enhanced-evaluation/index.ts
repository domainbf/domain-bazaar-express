import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EvaluationRequest {
  domain: string;
}

interface EvaluationResponse {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain }: EvaluationRequest = await req.json();

    if (!domain) {
      return new Response(
        JSON.stringify({ error: '域名参数必需' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY未配置');
    }

    // 基础分析
    const basicAnalysis = analyzeDomainBasics(domain);

    // AI多维度分析
    const aiAnalysis = await getAIMultiDimensionalAnalysis(domain, basicAnalysis, LOVABLE_API_KEY);

    // 综合评估结果
    const result: EvaluationResponse = {
      domain,
      estimatedValue: aiAnalysis.estimatedValue,
      valueRange: aiAnalysis.valueRange,
      dimensions: aiAnalysis.dimensions,
      overallAnalysis: aiAnalysis.overallAnalysis,
      recommendations: aiAnalysis.recommendations,
      confidence: aiAnalysis.confidence,
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('域名评估错误:', error);
    return new Response(
      JSON.stringify({ error: '域名评估失败', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function analyzeDomainBasics(domain: string) {
  const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
  const parts = cleanDomain.split('.');
  const name = parts[0];
  const extension = parts[parts.length - 1] || 'com';

  return {
    name,
    extension,
    length: name.length,
    hasNumbers: /\d/.test(name),
    hasHyphens: /-/.test(name),
    isPronounceable: !/[^a-z0-9]/.test(name) && name.length <= 12,
    keywords: extractKeywords(name),
  };
}

function extractKeywords(name: string): string[] {
  const techKeywords = ['ai', 'tech', 'app', 'web', 'cloud', 'data', 'smart', 'digital', 'mobile', 'cyber'];
  const businessKeywords = ['pay', 'shop', 'store', 'buy', 'sell', 'market', 'trade', 'finance', 'bank'];
  const allKeywords = [...techKeywords, ...businessKeywords];
  
  return allKeywords.filter(kw => name.includes(kw));
}

async function getAIMultiDimensionalAnalysis(domain: string, basics: any, apiKey: string) {
  const prompt = `作为资深域名评估专家，请对域名"${domain}"进行全面的多维度价值分析。

域名基本信息：
- 域名：${domain}
- 长度：${basics.length}字符
- 后缀：.${basics.extension}
- 包含数字：${basics.hasNumbers ? '是' : '否'}
- 包含连字符：${basics.hasHyphens ? '是' : '否'}
- 关键词：${basics.keywords.join(', ') || '无'}

请从以下6个维度进行深度分析，每个维度给出0-100分的评分和详细分析（30-50字）：

1. 市场趋势分析（marketTrend）- 评估域名在当前市场的热度和未来趋势
2. 行业应用价值（industryApplication）- 分析域名适合的行业和应用场景
3. 投资价值评估（investmentValue）- 评估域名的投资回报潜力
4. 品牌建设潜力（brandPotential）- 分析域名的品牌化能力和记忆度
5. 技术质量评分（technicalQuality）- 评估域名长度、结构、易读性等技术指标
6. SEO价值分析（seoValue）- 分析域名的搜索引擎优化潜力

然后提供：
- 综合评估（100-150字）
- 价格建议（USD）
- 3-5条实用建议

请以JSON格式返回，严格按照以下结构：
{
  "dimensions": {
    "marketTrend": { "score": 数字, "analysis": "分析文本" },
    "industryApplication": { "score": 数字, "analysis": "分析文本" },
    "investmentValue": { "score": 数字, "analysis": "分析文本" },
    "brandPotential": { "score": 数字, "analysis": "分析文本" },
    "technicalQuality": { "score": 数字, "analysis": "分析文本" },
    "seoValue": { "score": 数字, "analysis": "分析文本" }
  },
  "overallAnalysis": "综合评估文本",
  "estimatedValue": 数字,
  "recommendations": ["建议1", "建议2", "建议3"]
}`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的域名评估专家，拥有多年的域名投资和交易经验。请提供客观、专业的评估意见。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('AI服务请求过于频繁，请稍后重试');
      }
      if (response.status === 402) {
        throw new Error('AI服务额度不足，请联系管理员');
      }
      throw new Error(`AI服务错误: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('AI响应内容为空');
    }

    // 解析JSON响应
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('无法解析AI响应');
    }

    const aiResult = JSON.parse(jsonMatch[0]);

    // 计算价格范围和置信度
    const avgScore = Object.values(aiResult.dimensions).reduce((sum: number, dim: any) => sum + dim.score, 0) / 6;
    const confidence = Math.min(95, Math.max(60, Math.round(avgScore)));
    const estimatedValue = aiResult.estimatedValue || Math.round(800 + avgScore * 50);
    
    return {
      estimatedValue,
      valueRange: {
        min: Math.round(estimatedValue * 0.8),
        max: Math.round(estimatedValue * 1.3),
      },
      dimensions: aiResult.dimensions,
      overallAnalysis: aiResult.overallAnalysis,
      recommendations: aiResult.recommendations || [],
      confidence,
    };
  } catch (error) {
    console.error('AI分析失败，使用备用算法:', error);
    return getFallbackAnalysis(basics);
  }
}

function getFallbackAnalysis(basics: any) {
  const baseScore = 70 - (basics.length > 10 ? 15 : 0) + (basics.hasNumbers ? -10 : 5) + (basics.hasHyphens ? -15 : 0);
  const extScore = basics.extension === 'com' ? 90 : basics.extension === 'cn' ? 80 : 60;
  
  return {
    estimatedValue: Math.round(500 + baseScore * 20 + extScore * 10),
    valueRange: {
      min: Math.round(400 + baseScore * 15),
      max: Math.round(800 + baseScore * 30),
    },
    dimensions: {
      marketTrend: { score: baseScore, analysis: '基于当前市场数据的基础分析' },
      industryApplication: { score: baseScore + 5, analysis: '具备一定的行业应用潜力' },
      investmentValue: { score: baseScore - 5, analysis: '投资价值需结合市场时机判断' },
      brandPotential: { score: baseScore, analysis: '品牌建设需要长期运营' },
      technicalQuality: { score: extScore, analysis: `域名长度${basics.length}字符，结构${basics.hasHyphens ? '一般' : '良好'}` },
      seoValue: { score: baseScore + 10, analysis: '具备基本的SEO优化潜力' },
    },
    overallAnalysis: `域名"${basics.name}.${basics.extension}"整体评估为中等水平，建议结合具体业务需求和市场情况进行定价和使用决策。`,
    recommendations: [
      '建议关注相关行业的市场动态',
      '可考虑用于品牌建设或短期投资',
      '定价时参考类似域名的成交记录',
    ],
    confidence: Math.round(baseScore),
  };
}

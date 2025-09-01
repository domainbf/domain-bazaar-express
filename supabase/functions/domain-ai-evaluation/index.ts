import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DomainAnalysis {
  domain: string;
  estimatedPrice: number;
  description: string;
  factors: {
    length: number;
    extension: number;
    keywords: number;
    brandability: number;
    seo: number;
  };
  confidence: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { domain } = await req.json()
    
    if (!domain) {
      return new Response(
        JSON.stringify({ error: '域名参数必需' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const bailianApiKey = Deno.env.get('ALIBABA_CLOUD_BAILIAN_API_KEY')
    
    if (!bailianApiKey) {
      return new Response(
        JSON.stringify({ error: 'Bailian API密钥未配置' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Analyze domain structure
    const analysis = analyzeDomainStructure(domain)
    
    // Generate AI evaluation using Alibaba Cloud Bailian
    const aiDescription = await generateAIEvaluation(domain, analysis, bailianApiKey)
    
    const result: DomainAnalysis = {
      domain,
      estimatedPrice: analysis.estimatedPrice,
      description: aiDescription,
      factors: analysis.factors,
      confidence: analysis.confidence
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in domain-ai-evaluation:', error)
    return new Response(
      JSON.stringify({ error: '域名评估失败', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function analyzeDomainStructure(domain: string) {
  const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '')
  const parts = cleanDomain.split('.')
  const name = parts[0]
  const extension = parts[parts.length - 1] || 'com'

  // Length scoring (shorter is better, 2-4 chars premium)
  const lengthScore = name.length <= 2 ? 100 : 
                     name.length <= 4 ? 95 : 
                     name.length <= 6 ? 90 : 
                     name.length <= 10 ? 75 : 55

  // Extension scoring
  const extensionScores: { [key: string]: number } = {
    'com': 100, 'net': 85, 'org': 80, 'cn': 90, 'io': 80, 'ai': 85,
    'co': 75, 'app': 70, 'tech': 65, 'online': 50, 'site': 45
  }
  const extensionScore = extensionScores[extension] || 35

  // Keyword scoring (hot industry keywords)
  const hotKeywords = [
    'ai', 'tech', 'web', 'app', 'pay', 'shop', 'store', 'buy', 'sell', 'market', 'trade',
    'crypto', 'blockchain', 'nft', 'cloud', 'data', 'smart', 'digital', 'mobile', 'social', 'game',
    'finance', 'health', 'med', 'edu', 'travel', 'bank', 'card', 'seo', 'ads'
  ]
  const keywordMatches = hotKeywords.filter(kw => name.includes(kw))
  const keywordScore = Math.min(100, 50 + keywordMatches.length * 18)

  // Brandability scoring
  const hasNumbers = /\d/.test(name)
  const hasHyphens = /-/.test(name)
  const isPronounceable = !/[^a-z0-9]/.test(name) && name.length <= 12
  const repeatedChars = /(.)\1{2,}/.test(name) ? -10 : 0
  const brandabilityScore = Math.max(40, Math.min(100,
    70 + (isPronounceable ? 15 : 0) + (hasNumbers ? -10 : 10) + (hasHyphens ? -15 : 5) + repeatedChars
  ))

  // SEO scoring
  const commonWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all']
  const hasCommonWords = commonWords.some(word => name.includes(word))
  const seoScore = Math.min(100, 60 + (keywordMatches.length * 10) + (name.length <= 15 ? 10 : 0) + (hasCommonWords ? -5 : 5))

  const factors = {
    length: Math.round(lengthScore),
    extension: Math.round(extensionScore),
    keywords: Math.round(keywordScore),
    brandability: Math.round(brandabilityScore),
    seo: Math.round(seoScore)
  }

  // Base valuation (USD)
  let baseUSD = 800 + factors.length * 15 + factors.extension * 10 + factors.keywords * 8 + factors.brandability * 10 + factors.seo * 6

  // Short character premium
  if (name.length <= 4) {
    baseUSD *= name.length === 2 ? 6 : name.length === 3 ? 3 : 1.7
  }

  // TLD premium
  if (extension === 'com') baseUSD *= 1.6
  if (['ai', 'io'].includes(extension)) baseUSD *= 1.2

  const avgScore = (factors.length + factors.extension + factors.keywords + factors.brandability + factors.seo) / 5
  const confidence = Math.min(95, Math.max(55, Math.round(avgScore)))

  return {
    estimatedPrice: Math.max(300, Math.round(baseUSD)),
    factors,
    confidence,
    keywordMatches,
    extension,
    name
  }
}

async function generateAIEvaluation(domain: string, analysis: any, apiKey: string): Promise<string> {
  const prompt = `作为专业的域名评估师，请对域名"${domain}"进行详细的价值评估分析。

域名基本信息：
- 域名长度：${analysis.name.length}个字符
- 后缀：.${analysis.extension}
- 包含关键词：${analysis.keywordMatches.join(', ') || '无'}
- 估算价格：$${analysis.estimatedPrice.toLocaleString()}

评分维度：
- 长度评分：${analysis.factors.length}/100
- 后缀评分：${analysis.factors.extension}/100
- 关键词评分：${analysis.factors.keywords}/100
- 品牌化评分：${analysis.factors.brandability}/100
- SEO评分：${analysis.factors.seo}/100

请生成一个50-100字的专业域名价值评估介绍，内容应包括：
1. 域名的商业价值分析
2. 市场适用性评估
3. 投资建议或使用建议
4. 价格合理性说明

要求：语言专业、客观，符合域名投资行业标准。`

  try {
    // Call Alibaba Cloud Bailian API
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        input: {
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        parameters: {
          max_tokens: 200,
          temperature: 0.7
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Bailian API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    
    if (result.output && result.output.choices && result.output.choices[0]) {
      const aiResponse = result.output.choices[0].message.content
      
      // Ensure the response is within 50-100 characters
      if (aiResponse.length >= 50 && aiResponse.length <= 100) {
        return aiResponse
      } else if (aiResponse.length > 100) {
        return aiResponse.substring(0, 97) + '...'
      } else {
        // If response is too short, add a fallback
        return aiResponse + `该域名在${analysis.extension}后缀中具有良好的商业价值。`
      }
    }
    
    throw new Error('Bailian API返回格式异常')
  } catch (error) {
    console.error('Bailian API调用失败:', error)
    
    // Fallback to a template-based evaluation
    return generateFallbackEvaluation(domain, analysis)
  }
}

function generateFallbackEvaluation(domain: string, analysis: any): string {
  const templates = [
    `域名"${domain}"长度适中，.${analysis.extension}后缀具有较好的商业价值。基于当前市场评估，建议定价$${analysis.estimatedPrice.toLocaleString()}，适合品牌建设或投资收藏。`,
    `"${domain}"作为${analysis.name.length}字符域名，在.${analysis.extension}类别中显示出良好潜力。评估价格$${analysis.estimatedPrice.toLocaleString()}反映了其市场价值，推荐用于商业项目。`,
    `域名"${domain}"结构清晰，.${analysis.extension}后缀市场认知度高。综合评估定价$${analysis.estimatedPrice.toLocaleString()}，具备较强的品牌建设和投资价值。`
  ]
  
  const selectedTemplate = templates[Math.floor(Math.random() * templates.length)]
  
  // Ensure 50-100 characters
  if (selectedTemplate.length > 100) {
    return selectedTemplate.substring(0, 97) + '...'
  } else if (selectedTemplate.length < 50) {
    return selectedTemplate + '值得关注的优质域名资源。'
  }
  
  return selectedTemplate
}
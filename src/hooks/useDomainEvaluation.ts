
import { useState, useEffect } from 'react';
import { DomainValueEstimate } from '@/types/domain';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

interface DomainFactors {
  length: number;
  hasDash: boolean;
  hasNums: boolean;
  tld: string;
  keywords: string[];
}

export const useDomainEvaluation = (domainName?: string) => {
  const [estimate, setEstimate] = useState<DomainValueEstimate | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [similarDomains, setSimilarDomains] = useState<{name: string, price: number}[]>([]);
  
  useEffect(() => {
    if (domainName) {
      evaluateDomain(domainName);
    }
  }, [domainName]);
  
  const evaluateDomain = async (name: string) => {
    setIsLoading(true);
    try {
      // In a real app, this would call an API for valuation
      // For demo, we'll create a simple algorithm

      // Parse domain parts
      const factors = analyzeDomain(name);
      
      // Calculate base value
      let baseValue = calculateBaseValue(factors);
      
      // Get similar domains for comparison
      const similar = await fetchSimilarDomains(factors);
      setSimilarDomains(similar);
      
      // Adjust value based on similar domains
      if (similar.length > 0) {
        const avgPrice = similar.reduce((sum, domain) => sum + domain.price, 0) / similar.length;
        baseValue = (baseValue + avgPrice) / 2;
      }
      
      // Create range with +/- 20% 
      const minPrice = Math.round(baseValue * 0.8);
      const maxPrice = Math.round(baseValue * 1.2);
      
      // Generate evaluation factors
      const evaluationFactors = generateFactors(factors, similar);
      
      // Calculate confidence score (0-100)
      const confidenceScore = calculateConfidence(factors, similar);
      
      setEstimate({
        min_price: minPrice,
        max_price: maxPrice,
        factors: evaluationFactors,
        similar_domains: similar.map(d => ({
          name: d.name,
          price: d.price
        })),
        confidence_score: confidenceScore
      });
    } catch (error: any) {
      console.error('Error evaluating domain:', error);
      toast.error(error.message || '域名评估失败');
      setEstimate(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Analyze domain and extract factors
  const analyzeDomain = (name: string): DomainFactors => {
    const parts = name.split('.');
    const baseName = parts[0].toLowerCase();
    const tld = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'com';
    
    return {
      length: baseName.length,
      hasDash: baseName.includes('-'),
      hasNums: /\d/.test(baseName),
      tld,
      keywords: extractKeywords(baseName)
    };
  };
  
  // Extract potential keywords from domain name
  const extractKeywords = (name: string): string[] => {
    // This is a simplified approach - in a real app would use NLP
    const possibleKeywords = name.split(/[-_0-9]+/);
    return possibleKeywords.filter(k => k.length >= 3);
  };
  
  // Calculate base value based on domain factors
  const calculateBaseValue = (factors: DomainFactors): number => {
    let value = 500; // Base value
    
    // Length factor (shorter is generally more valuable)
    if (factors.length <= 3) {
      value += 2000;
    } else if (factors.length <= 5) {
      value += 1000;
    } else if (factors.length <= 8) {
      value += 500;
    } else {
      value += 100;
    }
    
    // TLD value
    if (factors.tld === 'com') {
      value += 1000;
    } else if (['net', 'org'].includes(factors.tld)) {
      value += 500;
    } else if (['io', 'ai', 'app'].includes(factors.tld)) {
      value += 800;
    }
    
    // Penalty for dashes and numbers
    if (factors.hasDash) value *= 0.8;
    if (factors.hasNums) value *= 0.9;
    
    // Keyword bonus
    if (factors.keywords.length > 0) {
      value += factors.keywords.length * 200;
    }
    
    return Math.round(value);
  };
  
  // Fetch similar domains from database for comparison
  const fetchSimilarDomains = async (factors: DomainFactors) => {
    try {
      // In a real app, this would be a more sophisticated query
      let query = supabase
        .from('domain_listings')
        .select('name, price')
        .eq('status', 'available');
      
      // Try to find domains with similar length
      const lengthRange = 2;
      query = query.gte('name', factors.length - lengthRange)
                  .lte('name', factors.length + lengthRange);
      
      const { data, error } = await query.limit(5);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        // Generate mock similar domains
        return generateMockSimilarDomains(factors);
      }
      
      return data.map(d => ({
        name: d.name,
        price: Number(d.price)
      }));
    } catch (error) {
      console.error('Error fetching similar domains:', error);
      // Fallback to mock data
      return generateMockSimilarDomains(factors);
    }
  };
  
  // Generate mock similar domains for comparison
  const generateMockSimilarDomains = (factors: DomainFactors) => {
    const similarDomains = [];
    const basePrice = calculateBaseValue(factors);
    
    // Generate 3-5 similar domains with slight variations in name and price
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const priceFactor = 0.8 + (Math.random() * 0.4); // 80-120% of base price
      similarDomains.push({
        name: `example${i + 1}.${factors.tld}`,
        price: Math.round(basePrice * priceFactor)
      });
    }
    
    return similarDomains;
  };
  
  // Generate evaluation factors explaining the estimate
  const generateFactors = (factors: DomainFactors, similar: {name: string, price: number}[]): any[] => {
    const evaluationFactors = [];
    
    // Domain length factor
    const lengthImpact = factors.length <= 5 ? 4 : factors.length <= 8 ? 3 : 2;
    evaluationFactors.push({
      name: '域名长度',
      impact: lengthImpact,
      description: `${factors.length}个字符的域名${factors.length <= 5 ? '非常简短，增加价值' : factors.length <= 8 ? '长度适中' : '较长，可能降低价值'}`
    });
    
    // TLD factor
    const tldImpact = factors.tld === 'com' ? 5 : ['net', 'org'].includes(factors.tld) ? 4 : 3;
    evaluationFactors.push({
      name: '顶级域名(TLD)',
      impact: tldImpact,
      description: `.${factors.tld}${factors.tld === 'com' ? '是最受欢迎的顶级域名，增加价值' : ''}`
    });
    
    // Composition factor
    let compositionImpact = 3;
    let compositionDesc = '域名结构良好';
    if (factors.hasDash) {
      compositionImpact = 2;
      compositionDesc = '包含连字符，略微降低价值';
    }
    if (factors.hasNums) {
      compositionImpact = factors.hasDash ? 1 : 2;
      compositionDesc = factors.hasDash ? '包含连字符和数字，降低价值' : '包含数字，略微降低价值';
    }
    evaluationFactors.push({
      name: '域名组成',
      impact: compositionImpact,
      description: compositionDesc
    });
    
    // Keywords factor
    if (factors.keywords.length > 0) {
      evaluationFactors.push({
        name: '关键词',
        impact: 4,
        description: `包含${factors.keywords.length}个潜在关键词，提高价值`
      });
    }
    
    // Market comparison
    if (similar.length > 0) {
      const avgPrice = similar.reduce((sum, domain) => sum + domain.price, 0) / similar.length;
      evaluationFactors.push({
        name: '市场对比',
        impact: 4,
        description: `与${similar.length}个类似域名比较，平均价格$${Math.round(avgPrice).toLocaleString()}`
      });
    }
    
    return evaluationFactors;
  };
  
  // Calculate confidence score
  const calculateConfidence = (factors: DomainFactors, similar: any[]): number => {
    let score = 50; // Base confidence
    
    // More similar domains = higher confidence
    score += similar.length * 5;
    
    // Common TLDs = higher confidence
    if (factors.tld === 'com') {
      score += 15;
    } else if (['net', 'org', 'io'].includes(factors.tld)) {
      score += 10;
    }
    
    // Longer keyword matches = higher confidence
    score += factors.keywords.length * 5;
    
    // Cap at 100
    return Math.min(100, score);
  };
  
  return {
    estimate,
    isLoading,
    similarDomains,
    evaluateDomain
  };
};


import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Domain, DomainPriceHistory } from "@/types/domain";

export interface UseDomainDetailResult {
  domain: Domain | null;
  priceHistory: DomainPriceHistory[];
  similarDomains: Domain[];
  isLoading: boolean;
  error: string | null;
  loadDomainDetails: () => void;
  reload: () => void;
}

export function useDomainDetail(domainId?: string): UseDomainDetailResult {
  const [domain, setDomain] = useState<Domain | null>(null);
  const [priceHistory, setPriceHistory] = useState<DomainPriceHistory[]>([]);
  const [similarDomains, setSimilarDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDomainDetails = useCallback(async () => {
    if (!domainId) return;

    setIsLoading(true);
    setError(null);
    try {
      let domainQuery = supabase
        .from('domain_listings')
        .select(`
          *,
          domain_analytics(views, favorites, offers),
          profiles(username, full_name, avatar_url)
        `);

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(domainId);

      if (isUUID) {
        domainQuery = domainQuery.eq('id', domainId);
      } else {
        domainQuery = domainQuery.eq('name', domainId);
      }
      const { data: domainData, error: domainError } = await domainQuery.single();
      if (domainError) {
        setError('域名不存在或已被删除');
        setDomain(null);
        return;
      }

      const processedDomain: Domain = {
        id: domainData.id,
        name: domainData.name || '',
        price: Number(domainData.price) || 0,
        category: domainData.category || 'standard',
        description: domainData.description || '',
        status: domainData.status || 'available',
        highlight: Boolean(domainData.highlight),
        owner_id: domainData.owner_id || '',
        created_at: domainData.created_at || new Date().toISOString(),
        is_verified: Boolean(domainData.is_verified),
        verification_status: domainData.verification_status || 'pending',
        views: 0,
      };

      if (domainData.domain_analytics && Array.isArray(domainData.domain_analytics) && domainData.domain_analytics.length > 0) {
        const analytics = domainData.domain_analytics[0];
        if (analytics) {
          processedDomain.views = Number(analytics.views) || 0;
        }
      }

      setDomain(processedDomain);

      // 并行加载相关信息
      await Promise.all([
        loadPriceHistory(processedDomain.id),
        loadSimilarDomains(processedDomain.name, processedDomain.category),
        updateDomainViews(processedDomain.id)
      ]);
    } catch (error: any) {
      setError('加载域名详情失败，请刷新重试');
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line
  }, [domainId]);

  const loadPriceHistory = async (domainId: string) => {
    try {
      const { data, error } = await supabase
        .from('domain_price_history')
        .select('*')
        .eq('domain_id', domainId)
        .order('created_at', { ascending: true })
        .limit(50);
      if (!error && data) {
        setPriceHistory(data);
      }
    } catch (_) {
      // 忽略错误
    }
  };

  const loadSimilarDomains = async (domainName: string, category?: string) => {
    try {
      let query = supabase
        .from('domain_listings')
        .select('*')
        .eq('status', 'available')
        .neq('name', domainName)
        .limit(6);
      if (category && category !== 'standard') {
        query = query.eq('category', category);
      }
      const { data } = await query;
      if (data) {
        setSimilarDomains(data);
      }
    } catch (_) { }
  };

  const updateDomainViews = async (domainId: string) => {
    try {
      await supabase
        .from('domain_analytics')
        .upsert(
          { domain_id: domainId, views: 1 },
          { onConflict: 'domain_id', ignoreDuplicates: false }
        );
    } catch (_) { }
  };

  useEffect(() => {
    if (domainId) {
      loadDomainDetails();
    }
  }, [domainId, loadDomainDetails]);

  // reload for outside call/lazy retry
  const reload = loadDomainDetails;

  return { domain, priceHistory, similarDomains, isLoading, error, loadDomainDetails, reload };
}


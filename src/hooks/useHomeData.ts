import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HomeDomainItem {
  id: string;
  name: string;
  price: number;
  logoUrl?: string;
}

export interface HomeData {
  hotDomains: HomeDomainItem[];
  soldDomains: HomeDomainItem[];
  auctionDomains: HomeDomainItem[];
  logoMap: Record<string, string>;
  totalSold: number;
}

export const fetchHomeData = async (): Promise<HomeData> => {
  // Fetch hot domains, sold domains, logo settings, and auctions in parallel
  const [hotRes, soldRes, logoRes, auctionRes] = await Promise.all([
    supabase
      .from('domain_listings')
      .select('id, name, price')
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .limit(40),
    supabase
      .from('domain_listings')
      .select('id, name, price')
      .eq('status', 'sold')
      .order('created_at', { ascending: false })
      .limit(40),
    supabase
      .from('site_settings')
      .select('key, value')
      .like('key', 'domain_logo_%'),
    supabase
      .from('domain_auctions')
      .select('id, starting_price, current_price, domain_id')
      .eq('status', 'active')
      .limit(20),
  ]);

  // Build logo map
  const logoMap: Record<string, string> = {};
  for (const row of (logoRes.data ?? [])) {
    const id = (row.key as string).replace('domain_logo_', '');
    if (row.value) logoMap[id] = row.value as string;
  }

  const hotDomains: HomeDomainItem[] = (hotRes.data ?? []).map((d: any) => ({
    id: String(d.id),
    name: String(d.name),
    price: Number(d.price) || 0,
    logoUrl: logoMap[d.id] || undefined,
  }));

  const soldDomains: HomeDomainItem[] = (soldRes.data ?? []).map((d: any) => ({
    id: String(d.id),
    name: String(d.name),
    price: Number(d.price) || 0,
    logoUrl: logoMap[d.id] || undefined,
  }));

  // For auctions, we need to fetch domain names separately
  const auctionRows = auctionRes.data ?? [];
  let auctionDomains: HomeDomainItem[] = [];
  if (auctionRows.length > 0) {
    const domainIds = auctionRows.map((a: any) => a.domain_id).filter(Boolean);
    if (domainIds.length > 0) {
      const { data: domainData } = await supabase
        .from('domain_listings')
        .select('id, name, price')
        .in('id', domainIds);
      const domainMap = new Map((domainData ?? []).map((d: any) => [d.id, d]));
      auctionDomains = auctionRows
        .filter((a: any) => domainMap.has(a.domain_id))
        .map((a: any) => {
          const d = domainMap.get(a.domain_id)!;
          return {
            id: String(d.id),
            name: String(d.name),
            price: Number(a.current_price) || Number(a.starting_price) || 0,
            logoUrl: logoMap[d.id] || undefined,
          };
        });
    }
  }

  return {
    hotDomains,
    soldDomains,
    auctionDomains,
    logoMap,
    totalSold: soldDomains.length,
  };
};

export const HOME_DATA_KEY = ['home', 'data'] as const;

export const useHomeData = () =>
  useQuery({
    queryKey: HOME_DATA_KEY,
    queryFn: fetchHomeData,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });

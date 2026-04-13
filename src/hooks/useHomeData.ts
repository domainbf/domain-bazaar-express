import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HomeDomainItem {
  id: string;
  name: string;
  price: number;
  logoUrl?: string;
  category?: string;
  description?: string;
  highlight?: boolean;
  ownerId?: string;
  isVerified?: boolean;
  verificationStatus?: string;
  createdAt?: string;
}

export interface HomeData {
  hotDomains: HomeDomainItem[];
  soldDomains: HomeDomainItem[];
  auctionDomains: HomeDomainItem[];
  logoMap: Record<string, string>;
  totalSold: number;
}

const HOME_DOMAIN_SELECT = 'id, name, price, category, description, highlight, owner_id, is_verified, verification_status, created_at';

const mapListingToHomeItem = (
  listing: any,
  logoMap: Record<string, string>,
  overridePrice?: number
): HomeDomainItem => {
  const listingPrice = Number(listing.price) || 0;

  return {
    id: String(listing.id),
    name: String(listing.name),
    price: overridePrice ?? listingPrice,
    logoUrl: logoMap[String(listing.id)] || undefined,
    category: listing.category ? String(listing.category) : undefined,
    description: listing.description ? String(listing.description) : undefined,
    highlight: Boolean(listing.highlight),
    ownerId: listing.owner_id ? String(listing.owner_id) : undefined,
    isVerified: Boolean(listing.is_verified),
    verificationStatus: listing.verification_status ? String(listing.verification_status) : undefined,
    createdAt: listing.created_at ? String(listing.created_at) : undefined,
  };
};

export const fetchHomeData = async (): Promise<HomeData> => {
  const [hotRes, soldRes, auctionRes] = await Promise.all([
    supabase
      .from('domain_listings')
      .select(HOME_DOMAIN_SELECT)
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .limit(40),
    supabase
      .from('domain_listings')
      .select(HOME_DOMAIN_SELECT, { count: 'exact' })
      .eq('status', 'sold')
      .order('created_at', { ascending: false })
      .limit(40),
    supabase
      .from('domain_auctions')
      .select('id, starting_price, current_price, domain_id')
      .eq('status', 'active')
      .limit(20),
  ]);

  const hotRows = hotRes.data ?? [];
  const soldRows = soldRes.data ?? [];
  const auctionRows = auctionRes.data ?? [];
  const auctionDomainIds = Array.from(
    new Set(
      auctionRows
        .map((auction: any) => auction.domain_id)
        .filter(Boolean)
        .map((id: string) => String(id))
    )
  );

  const neededDomainIds = Array.from(
    new Set([
      ...hotRows.map((row: any) => String(row.id)),
      ...soldRows.map((row: any) => String(row.id)),
      ...auctionDomainIds,
    ])
  );

  const [logoRes, auctionDomainRes] = await Promise.all([
    neededDomainIds.length > 0
      ? supabase
          .from('site_settings')
          .select('key, value')
          .in('key', neededDomainIds.map((id) => `domain_logo_${id}`))
      : Promise.resolve({ data: [] as any[] }),
    auctionDomainIds.length > 0
      ? supabase
          .from('domain_listings')
          .select(HOME_DOMAIN_SELECT)
          .in('id', auctionDomainIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const logoMap: Record<string, string> = {};
  for (const row of (logoRes.data ?? [])) {
    const id = (row.key as string).replace('domain_logo_', '');
    if (row.value) logoMap[id] = row.value as string;
  }

  const hotDomains = hotRows.map((listing: any) => mapListingToHomeItem(listing, logoMap));

  const soldDomains = soldRows.map((listing: any) => mapListingToHomeItem(listing, logoMap));

  let auctionDomains: HomeDomainItem[] = [];
  if (auctionRows.length > 0 && auctionDomainRes.data?.length) {
    const domainMap = new Map((auctionDomainRes.data ?? []).map((listing: any) => [String(listing.id), listing]));

    auctionDomains = auctionRows
      .filter((auction: any) => domainMap.has(String(auction.domain_id)))
      .map((auction: any) => {
        const listing = domainMap.get(String(auction.domain_id))!;
        const auctionPrice = Number(auction.current_price) || Number(auction.starting_price) || Number(listing.price) || 0;

        return mapListingToHomeItem(listing, logoMap, auctionPrice);
      });
  }

  return {
    hotDomains,
    soldDomains,
    auctionDomains,
    logoMap,
    totalSold: soldRes.count ?? soldDomains.length,
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

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/apiClient';

export interface HomeDomainItem {
  id: string;
  name: string;
  price: number;
  logoUrl?: string;
}

interface RawHomeData {
  hotDomains: Array<{ id: unknown; name: unknown; price: unknown }>;
  soldDomains: Array<{ id: unknown; name: unknown; price: unknown }>;
  logoMap: Record<string, string>;
  totalSold: number;
}

export interface HomeData {
  hotDomains: HomeDomainItem[];
  soldDomains: HomeDomainItem[];
  logoMap: Record<string, string>;
  totalSold: number;
}

const fetchHomeData = async (): Promise<HomeData> => {
  const raw = await apiGet<RawHomeData>('/data/home');
  const logoMap: Record<string, string> = raw?.logoMap ?? {};

  const mapItem = (d: { id: unknown; name: unknown; price: unknown }): HomeDomainItem => ({
    id: String(d.id ?? ''),
    name: String(d.name ?? ''),
    price: Number(d.price) || 0,
    logoUrl: logoMap[String(d.id)] || undefined,
  });

  return {
    hotDomains: (raw?.hotDomains ?? []).map(mapItem),
    soldDomains: (raw?.soldDomains ?? []).map(mapItem),
    logoMap,
    totalSold: raw?.totalSold ?? 0,
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

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiDelete } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const FAVORITES_KEY = ['favorites', 'me'] as const;

interface FavRow { domain_id: string }

export function useFavorites() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: FAVORITES_KEY,
    queryFn: async () => {
      if (!user) return [] as string[];
      const rows = await apiGet<FavRow[]>('/data/favorites');
      return rows.map(r => r.domain_id);
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const ids = query.data ?? [];
  const set = new Set(ids);

  const toggle = useMutation({
    mutationFn: async (domainId: string) => {
      if (!user) throw new Error('请先登录后再收藏');
      if (set.has(domainId)) {
        await apiDelete(`/data/favorites/${domainId}`);
        return { domainId, favorited: false };
      }
      await apiPost('/data/favorites', { domain_id: domainId });
      return { domainId, favorited: true };
    },
    onMutate: async (domainId) => {
      await qc.cancelQueries({ queryKey: FAVORITES_KEY });
      const prev = qc.getQueryData<string[]>(FAVORITES_KEY) ?? [];
      const next = prev.includes(domainId) ? prev.filter(x => x !== domainId) : [...prev, domainId];
      qc.setQueryData(FAVORITES_KEY, next);
      return { prev };
    },
    onError: (err: any, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(FAVORITES_KEY, ctx.prev);
      toast.error(err?.message || '操作失败');
    },
    onSuccess: (data) => {
      toast.success(data.favorited ? '已添加到收藏' : '已取消收藏');
    },
  });

  return {
    favorites: ids,
    favoriteSet: set,
    isFavorited: (id: string) => set.has(id),
    isLoading: query.isLoading,
    toggle: (id: string) => toggle.mutate(id),
    toggling: toggle.isPending,
  };
}

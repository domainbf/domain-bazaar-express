import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heart, ArrowLeft, ExternalLink } from 'lucide-react';
import { formatPrice } from '@/lib/currency';

interface DomainRow {
  id: string;
  name: string;
  price: number | null;
  currency: string | null;
  status: string | null;
}

export default function FavoritesPage() {
  const { user } = useAuth();
  const { favorites, isLoading: favLoading, toggle } = useFavorites();
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user || favorites.length === 0) { setDomains([]); setLoading(false); return; }
      setLoading(true);
      const { data } = await supabase
        .from('domains')
        .select('id, name, price, currency, status')
        .in('id', favorites);
      setDomains((data as any) || []);
      setLoading(false);
    })();
  }, [user, favorites.join(',')]);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/marketplace">
              <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold flex items-center gap-2">
                <Heart className="w-6 h-6 fill-current" /> 我的收藏
              </h1>
              <p className="text-sm text-muted-foreground">共 {favorites.length} 个域名</p>
            </div>
          </div>
        </div>

        {!user ? (
          <Card className="p-10 text-center">
            <p className="text-sm text-muted-foreground mb-4">请先登录以查看您的收藏</p>
            <Link to="/auth"><Button>去登录</Button></Link>
          </Card>
        ) : loading || favLoading ? (
          <div className="text-center py-16 text-sm text-muted-foreground">加载中…</div>
        ) : domains.length === 0 ? (
          <Card className="p-16 text-center">
            <Heart className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">您还没有收藏任何域名</p>
            <Link to="/marketplace"><Button>去发现好域名</Button></Link>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {domains.map((d) => (
              <Card key={d.id} className="group p-4 hover:border-primary transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/domain/${d.name}`} className="min-w-0 flex-1">
                    <div className="font-mono text-lg font-semibold uppercase truncate group-hover:text-primary">{d.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {d.price != null ? formatPrice(d.price, d.currency || 'CNY') : '面议'}
                    </div>
                  </Link>
                  <button
                    onClick={() => toggle(d.id)}
                    className="p-1.5 rounded-full hover:bg-muted"
                    aria-label="取消收藏"
                  >
                    <Heart className="w-4 h-4 fill-current text-primary" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{d.status || 'available'}</span>
                  <Link to={`/domain/${d.name}`} className="text-xs text-primary inline-flex items-center gap-1">
                    查看 <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

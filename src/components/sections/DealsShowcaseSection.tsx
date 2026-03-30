import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SoldDomain {
  id: string;
  name: string;
  price: number;
  logoUrl?: string;
}

function formatPrice(p: number) {
  if (!p) return '面议';
  if (p >= 10000) return `¥${(p / 10000).toFixed(p % 10000 === 0 ? 0 : 1)}万`;
  return `¥${p.toLocaleString()}`;
}

function getDomainInitials(name: string): string {
  const base = name.split('.')[0].toUpperCase();
  return base.length <= 4 ? base : base.slice(0, 3);
}

function SoldCard({ item, onClick }: { item: SoldDomain; onClick: () => void }) {
  const initials = getDomainInitials(item.name);
  const ext = item.name.includes('.') ? '.' + item.name.split('.').slice(1).join('.') : '';
  const base = item.name.split('.')[0].toUpperCase();

  return (
    <button
      onClick={onClick}
      className="group relative inline-flex flex-col items-center justify-center mx-2 shrink-0
        w-[120px] h-[80px] rounded-xl border border-border bg-card
        hover:border-foreground/40 hover:bg-muted/30 transition-all duration-200 overflow-hidden cursor-pointer"
    >
      {item.logoUrl ? (
        <>
          <img
            src={item.logoUrl}
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
            style={{ filter: 'grayscale(100%) contrast(1.1)' }}
          />
          <div className="absolute inset-0 bg-background/35" />
          <div className="relative z-10 flex flex-col items-center gap-0.5">
            <span className="text-xs font-black text-foreground tracking-widest leading-none drop-shadow">{base}</span>
            {ext && <span className="text-[9px] text-muted-foreground font-medium">{ext}</span>}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <span
            className="font-black text-foreground leading-none tracking-tight select-none"
            style={{ fontSize: initials.length <= 2 ? '1.75rem' : initials.length <= 3 ? '1.35rem' : '1.1rem' }}
          >
            {initials}
          </span>
          {ext && <span className="text-[10px] text-muted-foreground font-medium tracking-widest">{ext.toUpperCase()}</span>}
        </div>
      )}
      <span className="absolute bottom-1.5 right-2 text-[10px] text-muted-foreground/60 font-mono tabular-nums">
        {formatPrice(item.price)}
      </span>
      <span className="absolute top-1.5 left-1.5">
        <CheckCircle className="h-2.5 w-2.5 text-foreground/30" />
      </span>
    </button>
  );
}

function MarqueeTrack({ items, direction, onClick }: {
  items: SoldDomain[];
  direction: 'ltr' | 'rtl';
  onClick: (id: string) => void;
}) {
  if (!items.length) return null;
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden w-full">
      <div
        className={direction === 'rtl' ? 'animate-marquee-rtl' : 'animate-marquee-ltr'}
        style={{ display: 'flex', width: 'max-content', willChange: 'transform' }}
        onMouseEnter={e => (e.currentTarget.style.animationPlayState = 'paused')}
        onMouseLeave={e => (e.currentTarget.style.animationPlayState = 'running')}
      >
        {doubled.map((item, i) => (
          <SoldCard key={`${item.id}-${i}`} item={item} onClick={() => onClick(item.id)} />
        ))}
      </div>
    </div>
  );
}

export function DealsShowcaseSection() {
  const navigate = useNavigate();
  const [soldDomains, setSoldDomains] = useState<SoldDomain[]>([]);
  const [totalSold, setTotalSold] = useState(0);

  useEffect(() => {
    const fetchSold = async () => {
      const [soldRes, countRes] = await Promise.all([
        supabase
          .from('domain_listings')
          .select('id, name, price')
          .eq('status', 'sold')
          .order('created_at', { ascending: false })
          .limit(40),
        supabase
          .from('domain_listings')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'sold'),
      ]);

      const domains: SoldDomain[] = (soldRes.data || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        price: Number(d.price) || 0,
      }));

      if (domains.length) {
        const logoKeys = domains.map(d => `domain_logo_${d.id}`);
        const { data: logoData } = await supabase
          .from('site_settings').select('key, value').in('key', logoKeys);
        const logoMap: Record<string, string> = {};
        (logoData || []).forEach((r: any) => {
          const id = r.key.replace('domain_logo_', '');
          if (r.value) logoMap[id] = r.value;
        });
        domains.forEach(d => { d.logoUrl = logoMap[d.id]; });
      }

      setTotalSold(countRes.count || domains.length);
      const padded = domains.length >= 4 ? domains : [...domains, ...domains];
      setSoldDomains(padded);
    };

    fetchSold();
  }, []);

  if (!soldDomains.length) return null;

  const half = Math.ceil(soldDomains.length / 2);
  const row1 = soldDomains.slice(0, half);
  const row2 = soldDomains.slice(half);

  return (
    <section className="py-10 md:py-14 border-y border-border bg-background overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-foreground/60" />
          <div>
            <h2 className="text-lg font-bold text-foreground">成交案例</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              已有 <span className="font-semibold text-foreground">{totalSold}</span> 个域名在平台成功交易
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <MarqueeTrack items={row1} direction="ltr" onClick={(id) => navigate(`/domain/${id}`)} />
        {row2.length > 0 && (
          <MarqueeTrack items={row2} direction="rtl" onClick={(id) => navigate(`/domain/${id}`)} />
        )}
      </div>
    </section>
  );
}

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp, TrendingDown, Minus, Calendar, History,
  CheckCircle2, XCircle, Clock, AlertCircle, ArrowLeftRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface OfferHistoryProps {
  domainId: string;
  currentPrice: number;
  currency?: string;
}

interface Offer {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  message?: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.FC<{ className?: string }>; classes: string }> = {
  accepted:  { label: '已接受', icon: CheckCircle2,   classes: 'bg-green-500/10 text-green-600 border-green-200' },
  rejected:  { label: '已拒绝', icon: XCircle,        classes: 'bg-red-500/10 text-red-600 border-red-200' },
  pending:   { label: '待处理', icon: Clock,           classes: 'bg-yellow-500/10 text-yellow-600 border-yellow-200' },
  expired:   { label: '已过期', icon: AlertCircle,     classes: 'bg-gray-500/10 text-muted-foreground border-border' },
  countered: { label: '已还价', icon: ArrowLeftRight,  classes: 'bg-blue-500/10 text-blue-600 border-blue-200' },
};

const getStatusBadge = (status: string) => {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return <Badge variant="outline" className="text-xs">{status}</Badge>;
  const Icon = cfg.icon;
  return (
    <Badge className={`text-xs border gap-1 ${cfg.classes}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
};

const getPriceComparison = (offerAmount: number, currentPrice: number) => {
  if (!currentPrice) return null;
  const diff = ((offerAmount - currentPrice) / currentPrice) * 100;
  if (diff > 0)
    return <span className="flex items-center text-green-600 text-xs"><TrendingUp className="h-3 w-3 mr-0.5" />+{diff.toFixed(0)}%</span>;
  if (diff < 0)
    return <span className="flex items-center text-red-600 text-xs"><TrendingDown className="h-3 w-3 mr-0.5" />{diff.toFixed(0)}%</span>;
  return <span className="flex items-center text-muted-foreground text-xs"><Minus className="h-3 w-3 mr-0.5" />0%</span>;
};

export const OfferHistory: React.FC<OfferHistoryProps> = ({ domainId, currentPrice, currency = '¥' }) => {
  const { data: offers, isLoading } = useQuery({
    queryKey: ['offerHistory', domainId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('domain_offers')
        .select('id, amount, status, created_at, message')
        .eq('domain_id', domainId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as Offer[];
    },
    enabled: !!domainId,
  });

  const stats = React.useMemo(() => {
    if (!offers || offers.length === 0) return null;
    const amounts = offers.map(o => o.amount);
    const highest = Math.max(...amounts);
    const lowest = Math.min(...amounts);
    const average = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const pendingCount = offers.filter(o => o.status === 'pending').length;
    const acceptedCount = offers.filter(o => o.status === 'accepted').length;
    return { highest, lowest, average, total: offers.length, pendingCount, acceptedCount };
  }, [offers]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  if (!offers || offers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <History className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
        <p className="text-muted-foreground font-medium">暂无出价记录</p>
        <p className="text-sm text-muted-foreground mt-1">成为第一个出价的人吧！</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: '最高出价', value: `${currency}${stats.highest.toLocaleString()}`, color: 'text-green-600' },
            { label: '最低出价', value: `${currency}${stats.lowest.toLocaleString()}`, color: 'text-red-600' },
            { label: '平均出价', value: `${currency}${Math.round(stats.average).toLocaleString()}`, color: 'text-primary' },
            { label: '共计出价', value: `${stats.total} 次`, color: 'text-foreground' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center p-3 bg-muted/40 rounded-xl border">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className={`font-bold text-sm ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {offers.map((offer, index) => (
          <div
            key={offer.id}
            className={`flex items-center justify-between p-3 sm:p-4 border rounded-xl hover:bg-muted/30 transition-colors ${
              offer.status === 'accepted' ? 'border-green-200 bg-green-50/50' :
              offer.status === 'countered' ? 'border-blue-200 bg-blue-50/50' : ''
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
                #{index + 1}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-base sm:text-lg">{currency}{offer.amount.toLocaleString()}</span>
                  {getPriceComparison(offer.amount, currentPrice)}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <Calendar className="h-3 w-3" />
                  {formatDistanceToNow(new Date(offer.created_at), { addSuffix: true, locale: zhCN })}
                </div>
              </div>
            </div>
            <div className="shrink-0 ml-2">
              {getStatusBadge(offer.status)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

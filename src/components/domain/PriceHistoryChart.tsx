import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DomainPriceHistory } from '@/types/domain';
import { TrendingUp } from 'lucide-react';

interface PriceHistoryChartProps {
  data: DomainPriceHistory[];
}

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <TrendingUp className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
        <p className="text-muted-foreground font-medium">暂无价格历史记录</p>
        <p className="text-sm text-muted-foreground mt-1">价格调整后将在这里显示历史趋势</p>
      </div>
    );
  }

  const chartData = data.map(item => ({
    date: new Date(item.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
    price: Number(item.price),
    reason: item.change_reason,
  }));

  const prices = chartData.map(d => d.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const padding = (maxP - minP) * 0.15 || maxP * 0.1;

  return (
    <div className="space-y-3">
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={30} />
            <YAxis
              tick={{ fontSize: 11 }}
              domain={[minP - padding, maxP + padding]}
              tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value) => [`¥${Number(value).toLocaleString()}`, '售价']}
              labelFormatter={(label) => `日期: ${label}`}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#priceGradient)"
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Price change log */}
      <div className="space-y-1.5">
        {[...chartData].reverse().map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-muted/40">
            <span className="text-muted-foreground">{item.date}</span>
            <span className="font-semibold">¥{item.price.toLocaleString()}</span>
            {item.reason && <span className="text-xs text-muted-foreground">{item.reason}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};


import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DomainPriceHistory } from '@/types/domain';

interface PriceHistoryChartProps {
  data: DomainPriceHistory[];
}

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({ data }) => {
  // 如果没有数据，显示占位图表
  if (!data || data.length === 0) {
    const placeholderData = [
      { date: '2024-01-01', price: 1000 },
      { date: '2024-06-01', price: 1200 },
      { date: '2024-12-01', price: 1500 }
    ];

    return (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={placeholderData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#8884d8" 
              strokeWidth={2}
              dot={{ fill: '#8884d8' }}
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-center text-muted-foreground mt-2">暂无价格历史数据</p>
      </div>
    );
  }

  // 处理实际数据
  const chartData = data.map(item => ({
    date: new Date(item.created_at).toLocaleDateString(),
    price: Number(item.price),
    change_reason: item.change_reason
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip 
            formatter={(value, name) => [`¥${Number(value).toLocaleString()}`, '价格']}
            labelFormatter={(value) => `日期: ${value}`}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#8884d8" 
            strokeWidth={2}
            dot={{ fill: '#8884d8' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

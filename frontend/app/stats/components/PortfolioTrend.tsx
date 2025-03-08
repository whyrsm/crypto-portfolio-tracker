'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AssetHolding {
  amount: number;
  usd_value: number;
}

interface Asset {
  total_amount: number;
  total_usd_value: number;
  holdings: {
    [exchange: string]: AssetHolding;
  };
}

interface TrendData {
  date: string;
  total_usd_value: number;
  assets: {
    [asset: string]: Asset;
  };
}

export default function PortfolioTrend() {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrendData = async () => {
      try {
        console.log('fetching trend data')
        const response = await fetch('http://localhost:3002/portfolio/stats');
        console.log(response)
        if (!response.ok) throw new Error('Failed to fetch trend data');
        const data = await response.json();
        setTrendData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTrendData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] bg-white rounded-lg shadow-lg p-3">
      <h2 className="text-xl font-semibold mb-4">Portfolio Value Trend</h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={trendData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(date) => {
              const d = new Date(date);
              return `${d.getDate()}/${d.getMonth() + 1}`;
            }}
          />
          <YAxis
            tickFormatter={(value) => {
              if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
              return `$${value}`;
            }}
          />
          <Tooltip
            formatter={(value: number) => {
              if (value >= 1000000) return [`$${(value / 1000000).toFixed(1)}M`, 'Portfolio Value'];
              if (value >= 1000) return [`$${(value / 1000).toFixed(1)}K`, 'Portfolio Value'];
              return [`$${value}`, 'Portfolio Value'];
            }}
            labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
          <Bar
            dataKey="total_usd_value"
            fill="#11111"
            radius={[4, 4, 0, 0]}
            label={{
              position: 'top',
              formatter: (value: number) => {
                if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
                return `$${value}`;
              }
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
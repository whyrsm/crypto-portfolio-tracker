'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center min-h-[400px] text-red-500">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl mb-1">Portfolio Value Trend</CardTitle>
      </CardHeader>
      <CardContent className="h-[500px]">
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
              fill="#111111"
              radius={[4, 4, 0, 0]}
              label={{
                position: 'top',
                fontSize: 11,
                formatter: (value: number) => {
                  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
                  return `$${value}`;
                }
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
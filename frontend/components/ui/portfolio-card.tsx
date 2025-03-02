"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useState } from "react";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface AssetHolding {
  amount: number;
  usd_value: number;
}

interface AssetData {
  total_amount: number;
  total_usd_value: number;
  holdings: {
    [exchange: string]: AssetHolding;
  };
}

interface PortfolioSummary {
  total_usd_value: number;
  assets: {
    [asset: string]: AssetData;
  };
}

interface PortfolioData {
  date: string;
  summary: PortfolioSummary;
  balances: {
    [exchange: string]: {
      [asset: string]: AssetHolding;
    };
  };
}

interface PortfolioCardProps {
  data: PortfolioData;
}

const getAssetLogo = (symbol: string) => {
  const normalizedSymbol = symbol.toLowerCase();
  return `/assets/logos/${normalizedSymbol}.svg`;
};

export default function PortfolioCard({ data: initialData }: PortfolioCardProps) {
  const { toast } = useToast();
  const [expandedAssets, setExpandedAssets] = useState<{[key: string]: boolean}>({});
  const [hideSmallBalances, setHideSmallBalances] = useState(true);
  const [data, setData] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    console.log("Refreshing data...")
    try {
      setIsRefreshing(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/portfolio/snapshot?refresh=true`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const newData = await response.json();
      setData(newData);
      toast({
        title: "Portfolio Updated",
        description: "Your portfolio data has been refreshed successfully."
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to refresh portfolio data. Please try again."
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredAssets = Object.entries(data.summary.assets)
    .filter(([, assetData]) => !hideSmallBalances || assetData.total_usd_value >= 1)
    .sort(([, a], [, b]) => b.total_usd_value - a.total_usd_value);

  return (
    <Card className="w-full max-w-lg md:max-w-2xl lg:max-w-4xl">
      <CardHeader className="p-4 md:p-6">
        <div className="flex flex-col">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl md:text-2xl mb-1">Portfolio Summary</CardTitle>
              <CardDescription>As of {new Date(data.date).toLocaleDateString()}</CardDescription>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`${isRefreshing ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-6 mb-2">
            <Badge variant="secondary" className="text-3xl md:text-4xl px-6 py-3 font-semibold">
              ${data.summary.total_usd_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0">
        <div className="space-y-4 md:space-y-6">
          <div className="flex items-center space-x-2 text-muted-foreground text-xs border-b pb-2">
            <Checkbox
              id="hideSmallBalances"
              checked={hideSmallBalances}
              onCheckedChange={(checked) => setHideSmallBalances(checked as boolean)}
            />
            <label
              htmlFor="hideSmallBalances"
              className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Hide Small Balances
            </label>
          </div>
          {filteredAssets.map(([asset, assetData]) => (
            <div key={asset} className="border-b pb-3 md:pb-4 last:border-0">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="relative w-5 h-5 md:w-6 md:h-6">
                    <Image
                      src={getAssetLogo(asset)}
                      alt={`${asset} logo`}
                      width={24}
                      height={24}
                      className="rounded-full"
                      onError={(e) => {
                        e.currentTarget.src = "/assets/logos/default.svg";
                      }}
                    />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold">{asset}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sm text-muted-foreground">{assetData.total_amount.toLocaleString()} {asset}</Badge>
                  <Badge className="text-sm">${assetData.total_usd_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Badge>
                  <button
                    onClick={() => setExpandedAssets(prev => ({ ...prev, [asset]: !prev[asset] }))}
                    className="p-1 hover:bg-secondary/20 rounded-full transition-colors"
                  >
                    {expandedAssets[asset] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
              </div>
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 overflow-hidden transition-all duration-300 ${expandedAssets[asset] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                {Object.entries(assetData.holdings).map(([exchange, holding]) => (
                  <div key={exchange} className="bg-secondary/20 p-2 md:p-3 rounded-lg">
                    <div className="text-xs md:text-sm font-medium">{exchange}</div>
                    <div className="text-xs md:text-sm text-muted-foreground">
                      {holding.amount.toLocaleString()} {asset}
                    </div>
                    <div className="text-xs md:text-sm">
                      ${holding.usd_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
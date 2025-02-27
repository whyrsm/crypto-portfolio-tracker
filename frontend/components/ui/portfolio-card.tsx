"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

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

export function PortfolioCard({ data }: PortfolioCardProps) {
  const [expandedAssets, setExpandedAssets] = useState<{[key: string]: boolean}>({});
  return (
    <Card className="w-full max-w-lg md:max-w-2xl lg:max-w-4xl">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-xl md:text-2xl">Portfolio Summary</CardTitle>
        <CardDescription>As of {new Date(data.date).toLocaleDateString()}</CardDescription>
        <div className="mt-2">
          <Badge variant="secondary" className="text-base md:text-lg">
            Total Value: ${data.summary.total_usd_value.toLocaleString()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0">
        <div className="space-y-4 md:space-y-6">
          {Object.entries(data.summary.assets).map(([asset, assetData]) => (
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
                        e.currentTarget.src = "https://assets.coingecko.com/coins/images/1/thumb/generic-crypto.png";
                      }}
                    />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold">{asset}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>${assetData.total_usd_value.toLocaleString()}</Badge>
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
                      ${holding.usd_value.toLocaleString()}
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
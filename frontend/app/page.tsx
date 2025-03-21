import PortfolioCard from "@/components/ui/portfolio-card";
import PortfolioTrend from "../components/ui/PortfolioTrend";

async function getPortfolioData() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/portfolio/snapshot`, {
    next: { revalidate: 300 } // Revalidate every 5 minutes
  });

  if (!res.ok) {
    throw new Error('Failed to fetch portfolio data');
  }
  
  return res.json();
}

export default async function Home() {
  const portfolioData = await getPortfolioData();

  // Sort assets by total USD value in descending order
  const sortedAssets = Object.fromEntries(
    Object.entries(portfolioData.summary.assets)
      .sort(([, a], [, b]) => (b as { total_usd_value: number }).total_usd_value - (a as { total_usd_value: number }).total_usd_value)
  );

  // Create a new portfolio data object with sorted assets
  const sortedPortfolioData = {
    ...portfolioData,
    summary: {
      ...portfolioData.summary,
      assets: sortedAssets
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 flex flex-col items-center space-y-8">
      <PortfolioCard data={sortedPortfolioData} />
      <PortfolioTrend />
    </div>
  );
}

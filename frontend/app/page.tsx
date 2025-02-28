import PortfolioCard from "@/components/ui/portfolio-card";

async function getPortfolioData() {
  const res = await fetch('http://localhost:3000/portfolio/snapshot', {
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
      .sort(([, a], [, b]) => b.total_usd_value - a.total_usd_value)
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
    <div className="min-h-screen p-4 sm:p-8 flex items-center justify-center">
      <PortfolioCard data={sortedPortfolioData} />
    </div>
  );
}

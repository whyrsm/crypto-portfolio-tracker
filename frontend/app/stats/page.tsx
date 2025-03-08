import PortfolioTrend from '../../components/ui/PortfolioTrend';
import TransactionHistory from '../../components/ui/TransactionHistory';

export default function StatsPage() {
  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <TransactionHistory />
      </div>
    </div>
  );
}
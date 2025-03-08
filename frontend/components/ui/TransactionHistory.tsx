'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Card } from "./card";

type TransactionType = 'deposit' | 'trade' | 'withdrawal';

interface Transaction {
  id: string;
  timestamp: number;
  type: TransactionType;
  exchange: string;
  symbol: string;
  amount: number;
  price?: number;
  fee?: {
    cost: number;
    currency: string;
  };
  side?: string;
  usd_value: number;
}

interface GroupedTransactions {
  deposits: Transaction[];
  trades: Transaction[];
  withdrawals: Transaction[];
}

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<GroupedTransactions>({ deposits: [], trades: [], withdrawals: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/portfolio/transactions`);
        if (!response.ok) throw new Error('Failed to fetch transactions');
        const data = await response.json();
        setTransactions(data.transactions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderTransactionTable = (transactions: Transaction[]) => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Date</th>
            <th className="text-left p-2">Exchange</th>
            <th className="text-left p-2">Symbol</th>
            <th className="text-right p-2">Amount</th>
            <th className="text-right p-2">USD Value</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-b hover:bg-secondary/20">
              <td className="p-2">{formatDate(tx.timestamp)}</td>
              <td className="p-2">{tx.exchange}</td>
              <td className="p-2">{tx.symbol}</td>
              <td className="p-2 text-right">{tx.amount.toLocaleString()}</td>
              <td className="p-2 text-right">${tx.usd_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (loading) {
    return (
      <Card className="w-full mt-8">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full mt-8">
        <div className="flex items-center justify-center min-h-[200px] text-red-500">
          {error}
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full mt-8">
      <Tabs defaultValue="deposit" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="deposit">Deposit</TabsTrigger>
          <TabsTrigger value="trade">Trade</TabsTrigger>
          <TabsTrigger value="withdrawal">Withdrawal</TabsTrigger>
        </TabsList>
        <TabsContent value="deposit">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Deposit History</h3>
            {transactions.deposits.length > 0 ? (
              renderTransactionTable(transactions.deposits)
            ) : (
              <p className="text-muted-foreground">No deposit history available</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="trade">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Trade History</h3>
            {transactions.trades.length > 0 ? (
              renderTransactionTable(transactions.trades)
            ) : (
              <p className="text-muted-foreground">No trade history available</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="withdrawal">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Withdrawal History</h3>
            {transactions.withdrawals.length > 0 ? (
              renderTransactionTable(transactions.withdrawals)
            ) : (
              <p className="text-muted-foreground">No withdrawal history available</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
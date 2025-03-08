export enum TransactionType {
  TRADE = 'trade',
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal'
}

export interface Transaction {
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

export interface GroupedTransactions {
  deposits: Transaction[];
  trades: Transaction[];
  withdrawals: Transaction[];
}

export interface TransactionHistory {
  transactions: GroupedTransactions;
}
import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';
import * as ccxt from 'ccxt';
import { Transaction, TransactionHistory, TransactionType } from './interfaces/transaction.interface';

interface AssetBalance {
  amount: number;
  usd_value: number;
}

interface BalanceData {
  [asset_name: string]: AssetBalance;
}

interface PortfolioBalance {
  source: string;
  data: BalanceData;
}

@Injectable()
export class PortfolioService {
  private binanceClients: ccxt.Exchange[];
  private bitgetClient: ccxt.Exchange;
  private hyperliquidClient: ccxt.Exchange;
  private hyperliquidUserAddress: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService
  ) {
    const binanceCredentials = this.configService.getBinanceCredentials();
    this.binanceClients = binanceCredentials.map(cred => new ccxt.binance({
      apiKey: cred.apiKey,
      secret: cred.apiSecret
    }));

    const bitgetCredentials = this.configService.getBitgetCredentials();
    this.bitgetClient = new ccxt.bitget({
      apiKey: bitgetCredentials.apiKey,
      secret: bitgetCredentials.apiSecret,
      password: bitgetCredentials.password
    });

    this.hyperliquidUserAddress = this.configService.getHyperLiquidCredentials().userAddress;
    this.hyperliquidClient = new ccxt.hyperliquid();
  }

  async getTransactionHistory(startTime?: number, endTime?: number): Promise<TransactionHistory> {
    try {
      const [binanceTransactions, bitgetTransactions, hyperliquidTransactions] = await Promise.all([
        this.getBinanceTransactions(startTime, endTime),
        this.getBitgetTransactions(startTime, endTime),
        this.getHyperliquidTransactions(startTime, endTime)
      ]);

      const allTransactions = [
        ...binanceTransactions,
        ...bitgetTransactions,
        ...hyperliquidTransactions
      ];

      // Group transactions by type and sort by timestamp
      const transactions = {
        deposits: allTransactions
          .filter(tx => tx.type === TransactionType.DEPOSIT)
          .sort((a, b) => b.timestamp - a.timestamp),
        trades: allTransactions
          .filter(tx => tx.type === TransactionType.TRADE)
          .sort((a, b) => b.timestamp - a.timestamp),
        withdrawals: allTransactions
          .filter(tx => tx.type === TransactionType.WITHDRAWAL)
          .sort((a, b) => b.timestamp - a.timestamp)
      };

      return { transactions };

    } catch (error) {
      throw new Error(`Failed to fetch transaction history: ${error.message}`);
    }
  }

  private async getBinanceTransactions(startTime?: number, endTime?: number): Promise<Transaction[]> {
    const allTransactions: Transaction[] = [];

    await Promise.all(this.binanceClients.map(async (client, index) => {
      try {
        const uniqueAssets = await this.databaseService.getUniqueAssetSymbols(`binance_${index + 1}`);
        
        // Fetch trades
        for (const asset of uniqueAssets) {
          // Skip fetching trades for stablecoins as they don't have USDT trading pairs
          if (asset === 'USDT' || asset === 'USDC' || asset === 'USD') continue;
          const symbol = `${asset}/USDT`;
          const trades = await client.fetchMyTrades(symbol, startTime);
          const tradeTransactions = trades.map(trade => ({
            id: trade.id,
            timestamp: trade.timestamp,
            datetime: new Date(trade.timestamp).toISOString().slice(0, 19).replace('T', ' '),
            type: TransactionType.TRADE,
            exchange: `binance_${index + 1}`,
            symbol: trade.symbol.split('/')[0],
            amount: trade.amount,
            price: trade.price,
            fee: trade.fee,
            side: trade.side,
            usd_value: trade.cost
          }));
          allTransactions.push(...tradeTransactions);
        }

        // Fetch deposits
        for (const asset of uniqueAssets) {
          const deposits = await client.fetchDeposits(asset, startTime);
          const depositTransactions = deposits.map(deposit => ({
            id: deposit.id,
            timestamp: deposit.timestamp,
            datetime: new Date(deposit.timestamp).toISOString().slice(0, 19).replace('T', ' '),
            type: TransactionType.DEPOSIT,
            exchange: `binance_${index + 1}`,
            symbol: deposit.currency,
            amount: deposit.amount,
            usd_value: deposit.amount * (deposit.currency === 'USDT' ? 1 : 0) // Need to implement price at timestamp
          }));
          allTransactions.push(...depositTransactions);
        }
        
        // Fetch withdrawals
        for (const asset of uniqueAssets) {
          const withdrawals = await client.fetchWithdrawals(asset, startTime);
          const withdrawalTransactions = withdrawals.map(withdrawal => ({
            id: withdrawal.id,
            timestamp: withdrawal.timestamp,
            datetime: new Date(withdrawal.timestamp).toISOString().slice(0, 19).replace('T', ' '),
            type: TransactionType.WITHDRAWAL,
            exchange: `binance_${index + 1}`,
            symbol: withdrawal.currency,
            amount: withdrawal.amount,
            fee: withdrawal.fee,
            usd_value: withdrawal.amount * (withdrawal.currency === 'USDT' ? 1 : 0) // Need to implement price at timestamp
          }));
          allTransactions.push(...withdrawalTransactions)
        }
      
      } catch (error) {
        console.error(`Failed to fetch Binance ${index + 1} transactions:`, error);
      }
    }));

    return allTransactions;
  }

  private async getBitgetTransactions(startTime?: number, endTime?: number): Promise<Transaction[]> {
    try {
      const allTransactions: Transaction[] = [];
      const uniqueAssets = await this.databaseService.getUniqueAssetSymbols('bitget');

      // Fetch trades for each asset
      for (const asset of uniqueAssets) {
        // Skip fetching trades for stablecoins as they don't have USDT trading pairs
        if (asset === 'USDT' || asset === 'USDC' || asset === 'USD') continue;
        const symbol = `${asset}/USDT`;
        const trades = await this.bitgetClient.fetchMyTrades(symbol, startTime, endTime);
        const tradeTransactions = trades.map(trade => ({
          id: trade.id,
          timestamp: trade.timestamp,
          datetime: new Date(trade.timestamp).toISOString().slice(0, 19).replace('T', ' '),
          type: TransactionType.TRADE,
          exchange: 'bitget',
          symbol: trade.symbol.split('/')[0],
          amount: trade.amount,
          price: trade.price,
          fee: trade.fee,
          side: trade.side,
          usd_value: trade.cost
        }));
        allTransactions.push(...tradeTransactions);
      }

      // Fetch deposits
      for (const asset of uniqueAssets) {
        // For deposits, we don't need to construct trading pairs
        const symbol = asset;
        const deposits = await this.bitgetClient.fetchDeposits(symbol, startTime, endTime);
        const depositTransactions = deposits.map(deposit => ({
          id: deposit.id,
          timestamp: deposit.timestamp,
          datetime: new Date(deposit.timestamp).toISOString().slice(0, 19).replace('T', ' '),
          type: TransactionType.DEPOSIT,
          exchange: 'bitget',
          symbol: deposit.currency,
          amount: deposit.amount,
          usd_value: deposit.amount * (deposit.currency === 'USDT' ? 1 : 0) // Need to implement price at timestamp
        }));
        allTransactions.push(...depositTransactions);
      }
      

      // Fetch withdrawals
      for (const asset of uniqueAssets) {
        // For withdrawals, we don't need to construct trading pairs
        const symbol = asset;
        const withdrawals = await this.bitgetClient.fetchWithdrawals(symbol, startTime, endTime);
        const withdrawalTransactions = withdrawals.map(withdrawal => ({
          id: withdrawal.id,
          timestamp: withdrawal.timestamp,
          datetime: new Date(withdrawal.timestamp).toLocaleString(),
          type: TransactionType.WITHDRAWAL,
          exchange: 'bitget',
          symbol: withdrawal.currency,
          amount: withdrawal.amount,
          fee: withdrawal.fee,
          usd_value: withdrawal.amount * (withdrawal.currency === 'USDT' ? 1 : 0) // Need to implement price at timestamp
        }));
        allTransactions.push(...withdrawalTransactions);
      }
      
      return allTransactions;
    } catch (error) {
      console.error('Failed to fetch Bitget transactions:', error);
      return [];
    }
  }

  private async getHyperliquidTransactions(startTime?: number, endTime?: number): Promise<Transaction[]> {
    try {
      const uniqueAssets = await this.databaseService.getUniqueAssetSymbols('hyperliquid');
      const allTransactions: Transaction[] = [];

      // Fetch trades
      const trades = await this.hyperliquidClient.fetchMyTrades(undefined, startTime, undefined, {
        user: this.hyperliquidUserAddress
      });

      const tradeTransactions = trades
        .filter(trade => uniqueAssets.includes(trade.symbol.split('/')[0]))
        .map(trade => ({
          id: trade.id,
          timestamp: trade.timestamp,
          datetime: new Date(trade.timestamp).toISOString().slice(0, 19).replace('T', ' '),
          type: TransactionType.TRADE,
          exchange: 'hyperliquid',
          symbol: trade.symbol.split('/')[0],
          amount: trade.amount,
          price: trade.price,
          fee: trade.fee,
          side: trade.side,
          usd_value: trade.cost
        }));
      allTransactions.push(...tradeTransactions);

      // Fetch deposits and withdrawals for each asset
      for (const asset of uniqueAssets) {
        // Fetch deposits
        const deposits = await this.hyperliquidClient.fetchDeposits(asset, startTime, endTime, {
          user: this.hyperliquidUserAddress
        });
        const depositTransactions = deposits.map(deposit => ({
          id: deposit.id,
          timestamp: deposit.timestamp,
          datetime: new Date(deposit.timestamp).toISOString().slice(0, 19).replace('T', ' '),
          type: TransactionType.DEPOSIT,
          exchange: 'hyperliquid',
          symbol: deposit.currency,
          amount: deposit.amount,
          usd_value: deposit.amount * (deposit.currency === 'USDT' ? 1 : 0) // Need to implement price at timestamp
        }));
        allTransactions.push(...depositTransactions);

        // Fetch withdrawals
        const withdrawals = await this.hyperliquidClient.fetchWithdrawals(asset, startTime, endTime, {
          user: this.hyperliquidUserAddress
        });
        const withdrawalTransactions = withdrawals.map(withdrawal => ({
          id: withdrawal.id,
          timestamp: withdrawal.timestamp,
          datetime: new Date(withdrawal.timestamp).toISOString().slice(0, 19).replace('T', ' '),
          type: TransactionType.WITHDRAWAL,
          exchange: 'hyperliquid',
          symbol: withdrawal.currency,
          amount: withdrawal.amount,
          fee: withdrawal.fee,
          usd_value: withdrawal.amount * (withdrawal.currency === 'USDT' ? 1 : 0) // Need to implement price at timestamp
        }));
        allTransactions.push(...withdrawalTransactions);
      }

      return allTransactions;
    } catch (error) {
      console.error('Failed to fetch Hyperliquid transactions:', error);
      return [];
    }
  }

  private async fetchUSDPrice(symbol: string): Promise<number> {
    try {
      if (symbol === 'USD' || symbol === 'USDT' || symbol === 'USDC') return 1;
      if (symbol === 'UBTC') symbol = 'BTC';

      const ticker = await this.bitgetClient.fetchTicker(`${symbol}/USDT`);
      return ticker.last;
    } catch (error) {
      console.warn(`Failed to fetch USD price for ${symbol}: ${error.message}`);
      return 0;
    }
  }

  // TODO: Implement USD to IDR conversion using a forex API
  private async getUSDToIDR(): Promise<number> {
    return 1; // Temporarily return 1 as we're focusing on USD values first
  }

  async getBinanceBalances() {
    try {
      const balances = await Promise.all(
        this.binanceClients.map(client => client.fetchBalance())
      );
      // Return separate balances for each account with USD and IDR values
      return Promise.all(balances.map(async balance => {
        const filteredBalance = {};
        for (const [asset_name, amount] of Object.entries(balance.total)) {
          if (amount > 0) {
            const usdPrice = await this.fetchUSDPrice(asset_name);
            const usdValue = amount * usdPrice;

            filteredBalance[asset_name] = {
              amount,
              usd_value: usdValue,
              usd_unit_price: usdPrice
              // TODO: Add IDR value conversion
            };
          }
        }
        return filteredBalance;
      }));
    } catch (error) {
      throw new Error(`Failed to fetch Binance balances: ${error.message}`);
    }
  }

  async getBitgetBalance() {
    try {
      const balance = await this.bitgetClient.fetchBalance();

      const filteredBalance = {};
      for (const [asset_name, amount] of Object.entries(balance.total)) {
        if (amount > 0) {
          const usdPrice = await this.fetchUSDPrice(asset_name);
          const usdValue = amount * usdPrice;

          filteredBalance[asset_name] = {
            amount,
            usd_value: usdValue,
            usd_unit_price: usdPrice
            // TODO: Add IDR value conversion
          };
        }
      }
      return filteredBalance;
    } catch (error) {
      throw new Error(`Failed to fetch Bitget balance: ${error.message}`);
    }
  }

  async getHyperliquidBalance() {
    try {
      const balance = await this.hyperliquidClient.fetchBalance({
        user: this.hyperliquidUserAddress,
        type: 'spot'
      });

      const filteredBalance = {};

      for (let [asset_name, amount] of Object.entries(balance.total)) {
        if (asset_name === 'UBTC') asset_name = 'BTC';
        if (amount > 0) {
          const usdPrice = await this.fetchUSDPrice(asset_name);
          const usdValue = amount * usdPrice;

          filteredBalance[asset_name] = {
            amount,
            usd_value: usdValue,
            usd_unit_price: usdPrice
            // TODO: Add IDR value conversion
          };
        }
      }
      return filteredBalance;
    } catch (error) {
      throw new Error(`Failed to fetch Hyperliquid balance: ${error.message}`);
    }
  }

  async getPortfolioTrend(startDate?: string, endDate?: string) {
    return this.databaseService.getPortfolioTrend(startDate, endDate);
  }

  async getPortfolioSnapshot(date?: string, forceRefresh?: boolean) {
    try {
      // Check if today's snapshot exists in DB
      const currentDate = date ? date : this.databaseService.getCurrentDate();
      const latestSnapshotDate = await this.databaseService.getLatestSnapshotDate();
      const refresh = forceRefresh ? true : false;

      const latestDate = latestSnapshotDate ? new Date(latestSnapshotDate).toISOString().split('T')[0] : null;
      const lastUpdate = latestSnapshotDate ? new Date(new Date(latestSnapshotDate).getTime() + (7 * 60 * 60 * 1000)).toISOString().slice(0, 19).replace('T', ' ') : null;

      // If snapshot exists for today, return from DB
      if (latestDate === currentDate && !refresh ) {
        console.log('Get data from database')
        const data = await this.databaseService.getSnapshot(date);
        const formattedData = await this.formatSnapshot(data, currentDate);
        return { ...formattedData, source: 'database', last_update: lastUpdate };
      }

      console.log('Get data from API')

      const balances = await this.fetchAllBalances();
      const snapshot = this.createBalanceSnapshot(balances);
      const summary = this.calculatePortfolioSummary(snapshot);

      const result = {
        date: currentDate,
        summary,
        balances: snapshot,
        source: 'api',
        last_update: new Date(new Date().getTime() + (7 * 60 * 60 * 1000)).toISOString().slice(0, 19).replace('T', ' ')
      };

      await this.databaseService.savePortfolioSnapshot(result);
      return result;
    } catch (error) {
      throw new Error(`Failed to get portfolio snapshot: ${error.message}`);
    }
  }

  private async fetchAllBalances() {
    const [binanceBalances, bitgetBalances, hyperliquidBalances] = await Promise.all([
      this.getBinanceBalances(),
      this.getBitgetBalance(),
      this.getHyperliquidBalance(),
    ]);
    return { binanceBalances, bitgetBalances, hyperliquidBalances };
  }

  private createBalanceSnapshot(balances: any) {
    const { binanceBalances, bitgetBalances, hyperliquidBalances } = balances;
    return {
      binance_1: binanceBalances[0],
      binance_2: binanceBalances[1],
      bitget: bitgetBalances,
      hyperliquid: hyperliquidBalances
    };
  }

  private calculatePortfolioSummary(snapshot: any) {
    const summary = {
      total_usd_value: 0,
      assets: {},
      usd_current_prices: {}
    };

    const allBalances: PortfolioBalance[] = [
      { source: 'binance_1', data: snapshot.binance_1 },
      { source: 'binance_2', data: snapshot.binance_2 },
      { source: 'bitget', data: snapshot.bitget },
      { source: 'hyperliquid', data: snapshot.hyperliquid }
    ];

    for (const balance of allBalances) {
      for (const [asset_name, data] of Object.entries(balance.data)) {
        summary.total_usd_value += data.usd_value;

        if (!summary.assets[asset_name]) {
          const currentPrice = this.fetchUSDPrice(asset_name);
          summary.assets[asset_name] = {
            total_amount: 0,
            total_usd_value: 0,
            usd_current_price: currentPrice,
            holdings: {}
          };
        }
        summary.assets[asset_name].total_amount += data.amount;
        summary.assets[asset_name].total_usd_value += data.usd_value;
        summary.assets[asset_name].holdings[balance.source] = {
          amount: data.amount,
          usd_value: data.usd_value
        };
      }
    }

    return summary;
  }

  private async formatSnapshot(data: any[], date: string) {
    const snapshot = {
      binance_1: {},
      binance_2: {},
      bitget: {},
      hyperliquid: {}
    };

    const summary = {
      total_usd_value: 0,
      assets: {},
      usd_current_prices: {}
    };

    if (Array.isArray(data)) {
      for (const record of data) {
        const { exchange_name, asset_name, amount, usd_value } = record;

        if (snapshot[exchange_name]) {
          snapshot[exchange_name][asset_name] = {
            amount,
            usd_value
          };
        }

        summary.total_usd_value += usd_value;

        if (!summary.assets[asset_name]) {
          const currentPrice = await this.fetchUSDPrice(asset_name);
          summary.assets[asset_name] = {
            total_amount: 0,
            total_usd_value: 0,
            usd_current_price: currentPrice,
            holdings: {}
          };
        }

        summary.assets[asset_name].total_amount += amount;
        summary.assets[asset_name].total_usd_value += usd_value;
        summary.assets[asset_name].holdings[exchange_name] = {
          amount,
          usd_value
        };
      }
    }

    return {
      date,
      summary,
      balances: snapshot
    };
  }
}
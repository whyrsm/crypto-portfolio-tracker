import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';
import * as ccxt from 'ccxt';

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

  private async fetchUSDPrice(symbol: string): Promise<number> {
    try {
      if (symbol === 'USD' || symbol === 'USDT' || symbol === 'USDC') return 1;
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
              usd_value: usdValue
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
            usd_value: usdValue
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

      for (const [asset_name, amount] of Object.entries(balance.total)) {
        if (amount > 0) {
          const usdPrice = await this.fetchUSDPrice(asset_name);
          const usdValue = amount * usdPrice;

          filteredBalance[asset_name] = {
            amount,
            usd_value: usdValue
            // TODO: Add IDR value conversion
          };
        }
      }
      return filteredBalance;
    } catch (error) {
      throw new Error(`Failed to fetch Hyperliquid balance: ${error.message}`);
    }
  }

  async getPortfolioSnapshot(date?: string) {
    try {
      // Check if today's snapshot exists in DB
      const currentDate = date ? date : this.databaseService.getCurrentDate();
      const latestSnapshotDate = await this.databaseService.getLatestSnapshotDate();

      console.log(latestSnapshotDate, currentDate)

      // If snapshot exists for today, return from DB
      if (latestSnapshotDate === currentDate) {
        console.log('Get data from database')
        const data = await this.databaseService.getSnapshot(date);
        return this.formatSnapshot(data);
      }

      console.log('Get data from API')

      const balances = await this.fetchAllBalances();
      const snapshot = this.createBalanceSnapshot(balances);
      const summary = this.calculatePortfolioSummary(snapshot);

      const result = {
        summary,
        balances: snapshot
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
      assets: {}
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
          summary.assets[asset_name] = {
            total_amount: 0,
            total_usd_value: 0,
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

  private formatSnapshot(data: any[]) {
    const snapshot = {
      binance_1: {},
      binance_2: {},
      bitget: {},
      hyperliquid: {}
    };

    const summary = {
      total_usd_value: 0,
      assets: {}
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
          summary.assets[asset_name] = {
            total_amount: 0,
            total_usd_value: 0,
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
      summary,
      balances: snapshot
    };
  }
}
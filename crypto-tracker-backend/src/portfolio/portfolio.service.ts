import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';
import * as ccxt from 'ccxt';

interface AssetBalance {
  amount: number;
  usd_value: number;
}

interface BalanceData {
  [currency: string]: AssetBalance;
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
        for (const [currency, amount] of Object.entries(balance.total)) {
          if (amount > 0) {
            const usdPrice = await this.fetchUSDPrice(currency);
            const usdValue = amount * usdPrice;
            
            filteredBalance[currency] = {
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
      for (const [currency, amount] of Object.entries(balance.total)) {
        if (amount > 0) {
          const usdPrice = await this.fetchUSDPrice(currency);
          const usdValue = amount * usdPrice;
          
          filteredBalance[currency] = {
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
      
      for (const [currency, amount] of Object.entries(balance.total)) {
        if (amount > 0) {
          const usdPrice = await this.fetchUSDPrice(currency);
          const usdValue = amount * usdPrice;
          
          filteredBalance[currency] = {
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

  async getPortfolioSnapshot() {
    const [binanceBalances, bitgetBalances, hyperliquidBalances] = await Promise.all([
      this.getBinanceBalances(),
      this.getBitgetBalance(),
      this.getHyperliquidBalance(),
    ]);

    const snapshot = {
      binance_1: binanceBalances[0],
      binance_2: binanceBalances[1],
      bitget: bitgetBalances,
      hyperliquid: hyperliquidBalances
    };

    // Calculate summary
    const summary = {
      total_usd_value: 0,
      assets: {}
    };

    // Process all balances
    const allBalances: PortfolioBalance[] = [
      { source: 'binance_1', data: binanceBalances[0] },
      { source: 'binance_2', data: binanceBalances[1] },
      { source: 'bitget', data: bitgetBalances },
      { source: 'hyperliquid', data: hyperliquidBalances }
    ];

    for (const balance of allBalances) {
      for (const [currency, data] of Object.entries(balance.data)) {
        // Add to total USD value
        summary.total_usd_value += data.usd_value;

        // Aggregate asset amounts
        if (!summary.assets[currency]) {
          summary.assets[currency] = {
            total_amount: 0,
            total_usd_value: 0,
            holdings: {}
          };
        }
        summary.assets[currency].total_amount += data.amount;
        summary.assets[currency].total_usd_value += data.usd_value;
        summary.assets[currency].holdings[balance.source] = {
          amount: data.amount,
          usd_value: data.usd_value
        };
      }
    }

    const result = {
      summary,
      balances: snapshot
    };

    // Save the snapshot to the database
    await this.databaseService.savePortfolioSnapshot(result);

    return result;
  }
}
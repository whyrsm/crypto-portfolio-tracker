import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import * as ccxt from 'ccxt';

@Injectable()
export class PortfolioService {
  private binanceClients: ccxt.Exchange[];
  private bitgetClient: ccxt.Exchange;

  constructor(private readonly configService: ConfigService) {
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
  }

  private async fetchUSDPrice(symbol: string): Promise<number> {
    try {
      if (symbol === 'USD' || symbol === 'USDT' || symbol === 'USDC') return 1;
      const ticker = await this.binanceClients[0].fetchTicker(`${symbol}/USDT`);
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
      const usdToIdr = await this.getUSDToIDR();
      
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

  async getPortfolioSnapshot() {
    const [binanceBalances, bitgetBalances] = await Promise.all([
      this.getBinanceBalances(),
      this.getBitgetBalance(),
    ]);

    return {
      binance_1: binanceBalances[0],
      binance_2: binanceBalances[1],
      bitget: bitgetBalances,
      // TODO: Add Hyperliquid integration
    };
  }
}
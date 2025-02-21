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

  async getBinanceBalances() {
    try {
      const balances = await Promise.all(
        this.binanceClients.map(client => client.fetchBalance())
      );
      
      // Return separate balances for each account
      return balances.map(balance => {
        const filteredBalance = {};
        Object.entries(balance.total).forEach(([currency, amount]) => {
          if (amount > 0) {
            filteredBalance[currency] = amount;
          }
        });
        return filteredBalance;
      });
    } catch (error) {
      throw new Error(`Failed to fetch Binance balances: ${error.message}`);
    }
  }

  async getBitgetBalance() {
    try {
      const balance = await this.bitgetClient.fetchBalance();
      return balance.total;
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
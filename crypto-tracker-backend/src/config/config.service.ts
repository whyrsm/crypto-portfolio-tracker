import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  private readonly config: { [key: string]: string };

  constructor() {
    this.config = {
      BINANCE_API_KEY: process.env.BINANCE_API_KEY || '',
      BINANCE_SECRET_KEY: process.env.BINANCE_SECRET_KEY || '',
      BINANCE_API_KEY_2: process.env.BINANCE_API_KEY_2 || '',
      BINANCE_SECRET_KEY_2: process.env.BINANCE_SECRET_KEY_2 || '',
      BITGET_API_KEY: process.env.BITGET_API_KEY || '',
      BITGET_SECRET_KEY: process.env.BITGET_SECRET_KEY || '',
      BITGET_PASSWORD: process.env.BITGET_PASSWORD || '',
      HYPERLIQUID_USER_ADDRESS: process.env.HYPERLIQUID_USER_ADDRESS || '',
      SUPABASE_URL: process.env.SUPABASE_URL || '',
      SUPABASE_KEY: process.env.SUPABASE_KEY || ''
    };
  }

  get(key: string): string {
    return this.config[key];
  }

  getBinanceCredentials() {
    return [
      {
        apiKey: this.get('BINANCE_API_KEY'),
        apiSecret: this.get('BINANCE_SECRET_KEY'),
      },
      {
        apiKey: this.get('BINANCE_API_KEY_2'),
        apiSecret: this.get('BINANCE_SECRET_KEY_2'),
      }
    ];
  }

  getBitgetCredentials() {
    return {
      apiKey: this.get('BITGET_API_KEY'),
      apiSecret: this.get('BITGET_SECRET_KEY'),
      password: this.get('BITGET_PASSWORD'),
    };
  }

  getHyperLiquidCredentials() {
    return {
      userAddress: this.get('HYPERLIQUID_USER_ADDRESS'),
    };
  }
}
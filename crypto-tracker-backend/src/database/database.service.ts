import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '../config/config.service';

@Injectable()
export class DatabaseService {
  private supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get('SUPABASE_URL'),
      this.configService.get('SUPABASE_KEY')
    );
  }

  async savePortfolioSnapshot(snapshot: any) {
    try {
      const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
      const rows = [];

      // Process balances from each exchange
      for (const [exchange, balances] of Object.entries(snapshot.balances)) {
        // Iterate through each asset in the exchange
        for (const [assetName, data] of Object.entries(balances)) {
          rows.push({
            timestamp,
            asset_name: assetName,
            exchange_name: exchange,
            amount: data.amount,
            usd_value: data.usd_value
          });
        }
      }

      const { data, error } = await this.supabase
        .from('portfolio_snapshots')
        .insert(rows);

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to save portfolio snapshot: ${error.message}`);
    }
  }

  async getLatestSnapshot() {
    try {
      const { data, error } = await this.supabase
        .from('portfolio_snapshots')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch latest snapshot: ${error.message}`);
    }
  }
}
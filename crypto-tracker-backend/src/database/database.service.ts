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

    getCurrentDate() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    async savePortfolioSnapshot(snapshot: any) {
        try {
        
            const rows = [];

            // Process balances from each exchange
            for (const [exchange, balances] of Object.entries(snapshot.balances)) {
                // Iterate through each asset in the exchange
                for (const [assetName, data] of Object.entries(balances)) {
                    rows.push({
                        date: new Date().toISOString(),
                        asset_name: assetName,
                        exchange_name: exchange,
                        amount: data.amount,
                        usd_value: data.usd_value
                    });
                }
            }

            return await this.supabase
                .from('portfolio_snapshots')
                .insert(rows);

        } catch (error) {
            throw new Error(`Failed to save portfolio snapshot: ${error.message}`);
        }
    }

    async getLatestSnapshotDate() {
        const { data: latestSnapshot } = await this.supabase
         .from('portfolio_snapshots')
         .select('date')
         .order('date', { ascending: false })
         .limit(1)
         .single();
        return latestSnapshot?.date;
    }

    async getSnapshot(date?: string) {
        try {
            if (!date) {
                date = this.getCurrentDate();
            }
            const query = this.supabase
                .from('portfolio_snapshots')
                .select('*')
                .eq('date', date)

            const { data, error } = await query;

            if (error) throw error;

            return data;
        } catch (error) {
            throw new Error(`Failed to fetch snapshots: ${error.message}`);
        }
    }
}
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
                        usd_value: data.usd_value,
                        usd_unit_price: data.usd_unit_price
                    });
                }
            }

            // Delete existing rows for the current date before inserting new ones
            await this.supabase
                .from('portfolio_snapshots')
                .delete()
                .eq('date', snapshot.date);

            console.log('Deleted existing rows for ' + snapshot.date)

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

    async getUniqueAssetSymbols(exchange?: string): Promise<string[]> {
        try {
            let query = this.supabase
                .from('portfolio_snapshots')
                .select('asset_name')
                .order('asset_name')
                .limit(1000);

            if (exchange) {
                query = query.eq('exchange_name', exchange);
            }

            const { data, error } = await query;
    
            if (error) throw error;
    
            // Get unique asset names
            const uniqueAssets = [...new Set(data.map(row => row.asset_name))];
            return uniqueAssets;
        } catch (error) {
            throw new Error(`Failed to fetch unique asset symbols: ${error.message}`);
        }
    }

    async getPortfolioTrend(startDate?: string, endDate?: string) {
        try {
            if (!endDate) {
                endDate = this.getCurrentDate();
            }
            if (!startDate) {
                const date = new Date(endDate);
                date.setDate(date.getDate() - 30); // Default to last 30 days
                startDate = date.toISOString().split('T')[0];
            }

            const { data, error } = await this.supabase
                .from('portfolio_snapshots')
                .select('date, asset_name, exchange_name, amount, usd_value')
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: true });

            if (error) throw error;

            // Group by date to calculate total portfolio value
            const portfolioTrend = data.reduce((acc, record) => {
                const date = record.date;
                if (!acc[date]) {
                    acc[date] = {
                        date,
                        total_usd_value: 0,
                        assets: {}
                    };
                }

                // Add to total portfolio value
                acc[date].total_usd_value += record.usd_value;

                // Track individual asset values
                if (!acc[date].assets[record.asset_name]) {
                    acc[date].assets[record.asset_name] = {
                        total_amount: 0,
                        total_usd_value: 0,
                        holdings: {}
                    };
                }

                const asset = acc[date].assets[record.asset_name];
                asset.total_amount += record.amount;
                asset.total_usd_value += record.usd_value;
                asset.holdings[record.exchange_name] = {
                    amount: record.amount,
                    usd_value: record.usd_value
                };

                return acc;
            }, {});

            return Object.values(portfolioTrend);
        } catch (error) {
            throw new Error(`Failed to fetch portfolio trend: ${error.message}`);
        }
    }
}
import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { ConfigService } from '../config/config.service';


@Controller('playground')
export class TestPlaygroundController {
    private supabase: SupabaseClient;

    constructor(
        private readonly configService: ConfigService
    ) {
        this.supabase = createClient(
            this.configService.get('SUPABASE_URL'),
            this.configService.get('SUPABASE_KEY')
        );
    }

    @Get('date-format')
    async testDateFormat() {
        return new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Jakarta',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).split('/').reverse().join('-');
    }

    @Get('snapshot')
    async testSnapshot() {
        const date = '2025-02-21'

        const query = this.supabase
            .from('portfolio_snapshots')
            .select('*')
            .eq('date', date)

        const { data, error } = await query;

        if (error) throw error;
        return data;
    }
}
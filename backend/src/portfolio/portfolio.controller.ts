import { Controller, Get, Query } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { ConfigService } from 'src/config/config.service';
import { DatabaseService } from 'src/database/database.service';

@Controller('portfolio')
export class PortfolioController {
  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService
  ) {}

  @Get('snapshot')
  async getPortfolioSnapshot(@Query('date') date?: string, @Query('refresh') refresh?: boolean) {
    return this.portfolioService.getPortfolioSnapshot(date, refresh);
  }

  @Get('snapshot-fetch')
  async getPortfolioSnapshotFetch() {
    return this.portfolioService.getPortfolioSnapshot();
  }

  @Get('latest-snapshot')
  async getPortfolioLatestSnapshot() {
    return this.databaseService.getSnapshot()
  }

  @Get('playground')
  async getPlayground() {
    return new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).split('/').reverse().join('-');
  }
}
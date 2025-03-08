import { Controller, Get, Query } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { TransactionHistory } from './interfaces/transaction.interface';

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get('stats')
  async getPortfolioTrend(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.portfolioService.getPortfolioTrend(startDate, endDate);
  }

  @Get('snapshot')
  async getPortfolioSnapshot(
    @Query('date') date?: string,
    @Query('forceRefresh') forceRefresh?: boolean,
  ) {
    return this.portfolioService.getPortfolioSnapshot(date, forceRefresh);
  }

  @Get('transactions')
  async getTransactionHistory(
    @Query('startTime') startTime?: number,
    @Query('endTime') endTime?: number,
  ): Promise<TransactionHistory> {
    return this.portfolioService.getTransactionHistory(startTime, endTime);
  }
}
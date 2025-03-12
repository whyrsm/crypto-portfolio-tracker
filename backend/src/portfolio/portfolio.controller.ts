import { Controller, Get, Query } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { TransactionHistory } from './interfaces/transaction.interface';
import { ChartDataResponse } from './interfaces/chart.interface';

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

  @Get('chart')
  async getPortfolioChart(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ChartDataResponse> {
    const trendData = await this.portfolioService.getPortfolioTrend(startDate, endDate);
    const chartData: string[][] = [];

    if (trendData.length === 0) {
      return { source: [] };
    }

    // Get all unique asset names from the first data point and filter out small values
    const firstDataPoint = trendData[0];
    const assetNames = Object.entries((firstDataPoint as { assets: Record<string, { total_usd_value: number }> }).assets)
      .filter(([_, asset]) => asset.total_usd_value >= 5)
      .map(([name]) => name);
    
    // Add header row with filtered asset names
    chartData.push(['Date', ...assetNames]);

    // Add data rows
    trendData.forEach(point => {
      const row = [(point as { date: string }).date];
      assetNames.forEach(asset => {
        const value = (point as { assets: Record<string, { total_usd_value?: number }> }).assets[asset]?.total_usd_value || 0;
        row.push(Math.round(value).toString());
      });
      chartData.push(row);
    });

    return { source: chartData };
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

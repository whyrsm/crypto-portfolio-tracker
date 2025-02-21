import { Controller, Get } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { ConfigService } from 'src/config/config.service';

@Controller('portfolio')
export class PortfolioController {
  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly configService: ConfigService) {}

  @Get('snapshot')
  async getPortfolioSnapshot() {
    return this.portfolioService.getPortfolioSnapshot();
  }
}
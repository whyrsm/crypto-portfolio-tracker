import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';

@Module({
  imports: [ConfigModule],
  controllers: [PortfolioController],
  providers: [PortfolioService],
})
export class PortfolioModule {}
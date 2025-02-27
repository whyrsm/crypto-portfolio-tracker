import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { DatabaseModule } from '../database/database.module';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [PortfolioController],
  providers: [PortfolioService],
})
export class PortfolioModule {}
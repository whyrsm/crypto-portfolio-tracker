import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TestPlaygroundController } from './test-playground.controller';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [TestPlaygroundController],
})
export class TestPlaygroundModule {}
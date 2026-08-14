import { Module } from '@nestjs/common';
import { LogisticsCostController } from './logistics-cost.controller';
import { LogisticsCostService } from './logistics-cost.service';

@Module({
  controllers: [LogisticsCostController],
  providers: [LogisticsCostService],
})
export class LogisticsCostModule {}

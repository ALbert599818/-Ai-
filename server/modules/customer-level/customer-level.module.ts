import { Module } from '@nestjs/common';
import { CustomerLevelController } from './customer-level.controller';
import { CustomerLevelService } from './customer-level.service';

@Module({
  controllers: [CustomerLevelController],
  providers: [CustomerLevelService],
})
export class CustomerLevelModule {}

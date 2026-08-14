import { Module } from '@nestjs/common';
import { ExcessMarketingController } from './excess-marketing.controller';
import { ExcessMarketingService } from './excess-marketing.service';

@Module({
  controllers: [ExcessMarketingController],
  providers: [ExcessMarketingService],
})
export class ExcessMarketingModule {}

import { Module } from '@nestjs/common';
import { CustomFeeConfigController } from './custom-fee-config.controller';
import { CustomFeeConfigService } from './custom-fee-config.service';

@Module({
  controllers: [CustomFeeConfigController],
  providers: [CustomFeeConfigService],
})
export class CustomFeeConfigModule {}

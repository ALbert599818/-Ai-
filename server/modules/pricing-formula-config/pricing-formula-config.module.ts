import { Module } from '@nestjs/common';
import { PricingFormulaConfigController } from './pricing-formula-config.controller';
import { PricingFormulaConfigService } from './pricing-formula-config.service';

@Module({
  controllers: [PricingFormulaConfigController],
  providers: [PricingFormulaConfigService],
  exports: [PricingFormulaConfigService],
})
export class PricingFormulaConfigModule {}

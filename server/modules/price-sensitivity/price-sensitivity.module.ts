import { Module } from '@nestjs/common';
import { PriceSensitivityController } from './price-sensitivity.controller';
import { PriceSensitivityService } from './price-sensitivity.service';

@Module({
  controllers: [PriceSensitivityController],
  providers: [PriceSensitivityService],
})
export class PriceSensitivityModule {}

import { Module } from '@nestjs/common';
import { OtherDiscountService } from './other-discount.service';
import { OtherDiscountController } from './other-discount.controller';

@Module({
  controllers: [OtherDiscountController],
  providers: [OtherDiscountService],
  exports: [OtherDiscountService],
})
export class OtherDiscountModule {}

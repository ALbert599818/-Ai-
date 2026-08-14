import { Module } from '@nestjs/common';
import { AfterSalesReserveController } from './after-sales-reserve.controller';
import { AfterSalesReserveService } from './after-sales-reserve.service';

@Module({
  controllers: [AfterSalesReserveController],
  providers: [AfterSalesReserveService],
})
export class AfterSalesReserveModule {}

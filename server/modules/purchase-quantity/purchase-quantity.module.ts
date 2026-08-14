import { Module } from '@nestjs/common';
import { PurchaseQuantityController } from './purchase-quantity.controller';
import { PurchaseQuantityService } from './purchase-quantity.service';

@Module({
  controllers: [PurchaseQuantityController],
  providers: [PurchaseQuantityService],
})
export class PurchaseQuantityModule {}

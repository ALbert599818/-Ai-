import { Module } from '@nestjs/common';
import { ProductGradeMarginController } from './product-grade-margin.controller';
import { ProductGradeMarginService } from './product-grade-margin.service';

@Module({
  controllers: [ProductGradeMarginController],
  providers: [ProductGradeMarginService],
})
export class ProductGradeMarginModule {}

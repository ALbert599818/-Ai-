import { Module } from '@nestjs/common';
import { CreditTermController } from './credit-term.controller';
import { CreditTermService } from './credit-term.service';

@Module({
  controllers: [CreditTermController],
  providers: [CreditTermService],
})
export class CreditTermModule {}

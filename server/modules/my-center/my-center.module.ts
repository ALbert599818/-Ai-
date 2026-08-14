import { Module } from '@nestjs/common';
import { MyCenterController } from './my-center.controller';
import { MyCenterService } from './my-center.service';

@Module({
  controllers: [MyCenterController],
  providers: [MyCenterService],
})
export class MyCenterModule {}

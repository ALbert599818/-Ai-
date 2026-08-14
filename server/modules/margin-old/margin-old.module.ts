import { Module } from '@nestjs/common';
import { MarginOldController } from './margin-old.controller';
import { MarginOldService } from './margin-old.service';

@Module({
  controllers: [MarginOldController],
  providers: [MarginOldService],
})
export class MarginOldModule {}

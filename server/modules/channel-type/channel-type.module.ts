import { Module } from '@nestjs/common';
import { ChannelTypeController } from './channel-type.controller';
import { ChannelTypeService } from './channel-type.service';

@Module({
  controllers: [ChannelTypeController],
  providers: [ChannelTypeService],
})
export class ChannelTypeModule {}

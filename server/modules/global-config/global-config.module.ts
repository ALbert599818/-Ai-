import { Module } from '@nestjs/common';
import { GlobalConfigController } from './global-config.controller';
import { GlobalConfigService } from './global-config.service';

@Module({
  controllers: [GlobalConfigController],
  providers: [GlobalConfigService],
})
export class GlobalConfigModule {}

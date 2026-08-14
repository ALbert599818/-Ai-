import { Module } from '@nestjs/common';
import { FileRecordController } from './file-record.controller';
import { FileRecordService } from './file-record.service';

@Module({
  controllers: [FileRecordController],
  providers: [FileRecordService],
})
export class FileRecordModule {}

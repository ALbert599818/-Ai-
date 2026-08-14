import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { NeedLogin } from '@server/lib/platform';
import { FileRecordService } from './file-record.service';
import type { BatchCreateFileRecordRequest } from '@shared/file-record';

@Controller('api/file-records')
export class FileRecordController {
  constructor(
    private readonly fileRecordService: FileRecordService,
  ) {}

  @NeedLogin()
  @Get()
  async findAll(
    @Query('folderPath') folderPath?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.fileRecordService.findAll({
      folderPath,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Post('batch')
  async batchCreate(@Body() data: BatchCreateFileRecordRequest) {
    const result = await this.fileRecordService.batchCreate(data.files);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.fileRecordService.remove(id);
    return { code: 0, data: result };
  }
}

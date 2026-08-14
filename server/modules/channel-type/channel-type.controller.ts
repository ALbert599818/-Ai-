import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { NeedLogin } from '@server/lib/platform';
import { UseInterceptors } from '@nestjs/common';
import { JwtRoleInterceptor } from '@server/common/guards/jwt-role.interceptor';
import { ChannelTypeService } from './channel-type.service';
import type {
  CreateChannelTypeRequest,
  UpdateChannelTypeRequest,
} from '@shared/channel-type';

@Controller('api/channel-types')
@UseInterceptors(JwtRoleInterceptor)
export class ChannelTypeController {
  constructor(
    private readonly channelTypeService: ChannelTypeService,
  ) {}

  @Get()
  async findAll(
    @Query('keyword') keyword?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.channelTypeService.findAll({
      keyword,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Post()
  async create(@Body() data: CreateChannelTypeRequest) {
    const result = await this.channelTypeService.create(data);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateChannelTypeRequest,
  ) {
    const result = await this.channelTypeService.update(id, data);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.channelTypeService.remove(id);
    return { code: 0, data: result };
  }
}

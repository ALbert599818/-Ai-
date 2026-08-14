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
import { ExcessMarketingService } from './excess-marketing.service';
import type {
  CreateExcessMarketingRequest,
  UpdateExcessMarketingRequest,
} from '@shared/excess-marketing';

@Controller('api/excess-marketing')
@UseInterceptors(JwtRoleInterceptor)
export class ExcessMarketingController {
  constructor(
    private readonly excessMarketingService: ExcessMarketingService,
  ) {}

  @Get()
  async findAll(
    @Query('keyword') keyword?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.excessMarketingService.findAll({
      keyword,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Post()
  async create(@Body() data: CreateExcessMarketingRequest) {
    const result = await this.excessMarketingService.create(data);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateExcessMarketingRequest,
  ) {
    const result = await this.excessMarketingService.update(id, data);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.excessMarketingService.remove(id);
    return { code: 0, data: result };
  }
}

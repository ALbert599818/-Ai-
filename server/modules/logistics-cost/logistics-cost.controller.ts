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
import { LogisticsCostService } from './logistics-cost.service';
import type {
  CreateLogisticsCostRequest,
  UpdateLogisticsCostRequest,
} from '@shared/logistics-cost';

@Controller('api/logistics-costs')
@UseInterceptors(JwtRoleInterceptor)
export class LogisticsCostController {
  constructor(
    private readonly logisticsCostService: LogisticsCostService,
  ) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.logisticsCostService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Post()
  async create(@Body() dto: CreateLogisticsCostRequest) {
    const result = await this.logisticsCostService.create(dto);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLogisticsCostRequest,
  ) {
    const result = await this.logisticsCostService.update(id, dto);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.logisticsCostService.remove(id);
    return { code: 0, data: result };
  }
}

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
import { AfterSalesReserveService } from './after-sales-reserve.service';
import type {
  CreateAfterSalesReserveRequest,
  UpdateAfterSalesReserveRequest,
} from '@shared/after-sales-reserve';

@Controller('api/after-sales-reserves')
@UseInterceptors(JwtRoleInterceptor)
export class AfterSalesReserveController {
  constructor(
    private readonly afterSalesReserveService: AfterSalesReserveService,
  ) {}

  @Get()
  async findAll(
    @Query('keyword') keyword?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.afterSalesReserveService.findAll({
      keyword,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Post()
  async create(@Body() data: CreateAfterSalesReserveRequest) {
    const result = await this.afterSalesReserveService.create(data);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateAfterSalesReserveRequest,
  ) {
    const result = await this.afterSalesReserveService.update(
      id,
      data,
    );
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.afterSalesReserveService.remove(id);
    return { code: 0, data: result };
  }
}

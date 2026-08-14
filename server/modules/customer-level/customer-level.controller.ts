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
import { CustomerLevelService } from './customer-level.service';
import type {
  CreateCustomerLevelRequest,
  UpdateCustomerLevelRequest,
} from '@shared/customer-level';

@Controller('api/customer-levels')
@UseInterceptors(JwtRoleInterceptor)
export class CustomerLevelController {
  constructor(
    private readonly customerLevelService: CustomerLevelService,
  ) {}

  @Get()
  async findAll(
    @Query('keyword') keyword?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.customerLevelService.findAll({
      keyword,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Post()
  async create(@Body() data: CreateCustomerLevelRequest) {
    const result = await this.customerLevelService.create(data);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateCustomerLevelRequest,
  ) {
    const result = await this.customerLevelService.update(id, data);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.customerLevelService.remove(id);
    return { code: 0, data: result };
  }
}

import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { NeedLogin } from '@server/lib/platform';
import { UseInterceptors } from '@nestjs/common';
import { JwtRoleInterceptor } from '@server/common/guards/jwt-role.interceptor';
import { OtherDiscountService } from './other-discount.service';
import type { Request } from 'express';

@Controller('api/other-discounts')
@UseInterceptors(JwtRoleInterceptor)
export class OtherDiscountController {
  constructor(private readonly otherDiscountService: OtherDiscountService) {}

  @Get()
  async findAll(
    @Query('keyword') keyword?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    const result = await this.otherDiscountService.findAll({
      keyword,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
    return { code: 0, data: result };
  }

  @Post()
  @NeedLogin()
  async create(@Req() req: Request, @Body() data: { discountType: string; discount: number }) {
    const result = await this.otherDiscountService.create(data);
    return { code: 0, data: result };
  }

  @Put(':id')
  @NeedLogin()
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() data: { discountType: string; discount: number }
  ) {
    const result = await this.otherDiscountService.update(id, data);
    return { code: 0, data: result };
  }

  @Delete(':id')
  @NeedLogin()
  async remove(@Req() req: Request, @Param('id') id: string) {
    const result = await this.otherDiscountService.remove(id);
    return { code: 0, data: result };
  }
}

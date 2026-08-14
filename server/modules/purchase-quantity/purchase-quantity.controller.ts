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
import { PurchaseQuantityService } from './purchase-quantity.service';
import type {
  CreatePurchaseQuantityRequest,
  UpdatePurchaseQuantityRequest,
} from '@shared/purchase-quantity';

@Controller('api/purchase-quantities')
@UseInterceptors(JwtRoleInterceptor)
export class PurchaseQuantityController {
  constructor(
    private readonly purchaseQuantityService: PurchaseQuantityService,
  ) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.purchaseQuantityService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Post()
  async create(@Body() dto: CreatePurchaseQuantityRequest) {
    const result = await this.purchaseQuantityService.create(dto);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseQuantityRequest,
  ) {
    const result = await this.purchaseQuantityService.update(id, dto);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Post('import')
  async importItems(
    @Body() body: { rows: Array<{ typeDesc: string; discount: string; minMultiple?: string; maxMultiple?: string }> },
  ) {
    const result = await this.purchaseQuantityService.importItems(body.rows);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.purchaseQuantityService.remove(id);
    return { code: 0, data: result };
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { NeedLogin } from '@server/lib/platform';
import { UseInterceptors } from '@nestjs/common';
import { JwtRoleInterceptor } from '@server/common/guards/jwt-role.interceptor';
import { ProductCategoryService } from './product-category.service';
import type {
  CreateProductCategoryRequest,
  UpdateProductCategoryRequest,
} from '@shared/product-category';

@Controller('api/product-categories')
@UseInterceptors(JwtRoleInterceptor)
export class ProductCategoryController {
  constructor(private readonly productCategoryService: ProductCategoryService) {}

  @Get()
  async findAll() {
    const result = await this.productCategoryService.findAll();
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Post()
  async create(@Body() data: CreateProductCategoryRequest) {
    const result = await this.productCategoryService.create(data);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateProductCategoryRequest,
  ) {
    const result = await this.productCategoryService.update(id, data);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.productCategoryService.remove(id);
    return { code: 0, data: result };
  }
}

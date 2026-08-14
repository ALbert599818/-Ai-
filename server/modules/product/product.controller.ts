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
import { ProductService } from './product.service';
import type {
  CreateProductRequest,
  UpdateProductRequest,
  ProductImportRow,
} from '@shared/product';

@Controller('api/products')
@UseInterceptors(JwtRoleInterceptor)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @NeedLogin()
  @Get()
  async findAll(
    @Query('keyword') keyword?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.productService.findAll({
      keyword,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Post()
  async create(@Body() data: CreateProductRequest) {
    const result = await this.productService.create(data);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateProductRequest,
  ) {
    const result = await this.productService.update(id, data);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.productService.remove(id);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Post('import')
  async importProducts(
    @Body()
    body: { items: ProductImportRow[] },
  ) {
    const result = await this.productService.importProducts(
      body.items,
    );
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Get('categories')
  async getCategories() {
    const result = await this.productService.getCategories();
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Post('batch-grade')
  async batchUpdateGrade(
    @Body() body: { category: string; productGrade: string },
  ) {
    const result = await this.productService.batchUpdateGrade(
      body.category,
      body.productGrade,
    );
    return { code: 0, data: result };
  }
}

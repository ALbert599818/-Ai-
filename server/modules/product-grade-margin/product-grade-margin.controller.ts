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
import { ProductGradeMarginService } from './product-grade-margin.service';
import type {
  CreateProductGradeMarginRequest,
  UpdateProductGradeMarginRequest,
} from '@shared/product-grade-margin';

@Controller('api/product-grade-margins')
@UseInterceptors(JwtRoleInterceptor)
export class ProductGradeMarginController {
  constructor(
    private readonly service: ProductGradeMarginService,
  ) {}

  @Get()
  async findAll(
    @Query('keyword') keyword?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.service.findAll({
      keyword,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Post()
  async create(@Body() data: CreateProductGradeMarginRequest) {
    const result = await this.service.create(data);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateProductGradeMarginRequest,
  ) {
    const result = await this.service.update(id, data);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.service.remove(id);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Post('import')
  async importItems(
    @Body()
    body: {
      items: Array<{
        category: string;
        productGrade: string;
        targetMargin: string;
        marginRedline: string;
        salesRatio: string;
        marginContribution: string;
      }>;
    },
  ) {
    const result = await this.service.importItems(body.items);
    return { code: 0, data: result };
  }
}

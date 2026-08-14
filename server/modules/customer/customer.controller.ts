import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { NeedLogin } from '@server/lib/platform';
import { UseInterceptors } from '@nestjs/common';
import { JwtRoleInterceptor } from '@server/common/guards/jwt-role.interceptor';
import { CustomerService } from './customer.service';
import type {
  CreateCustomerRequest,
  UpdateCustomerRequest,
  BatchUpsertCategoryGradesRequest,
} from '@shared/customer';

@Controller('api/customers')
@UseInterceptors(JwtRoleInterceptor)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @NeedLogin()
  @Get()
  async findAll(
    @Query('keyword') keyword?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Req() req?: { userContext: { userId: string; roles?: string[] } },
  ) {
    const { userId, roles } = req?.userContext || {};
    const result = await this.customerService.findAll(
      {
        keyword,
        page: page ? parseInt(page, 10) : undefined,
        pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      },
      userId,
      roles,
    );
    return { code: 0, data: result };
  }

  @Get('search')
  async search(@Query('q') q: string) {
    const result = await this.customerService.search(q ?? '');
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Post()
  async create(
    @Body() data: CreateCustomerRequest,
    @Req() req?: { userContext: { userId: string; roles?: string[]; region?: string } },
  ) {
    const { userId, roles, region } = req?.userContext || {};
    const result = await this.customerService.create(data, userId, roles, region);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateCustomerRequest,
    @Req() req?: { userContext: { userId: string; roles?: string[]; region?: string } },
  ) {
    const { userId, roles, region } = req?.userContext || {};
    const result = await this.customerService.update(id, data, userId, roles, region);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.customerService.remove(id);
    return { code: 0, data: result };
  }

  @Get(':id/category-grades')
  async getCategoryGrades(@Param('id') id: string) {
    const result =
      await this.customerService.getCategoryGrades(id);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Put(':id/category-grades')
  async batchUpsertCategoryGrades(
    @Param('id') id: string,
    @Body() body: BatchUpsertCategoryGradesRequest,
  ) {
    await this.customerService.batchUpsertCategoryGrades(
      id,
      body.grades,
    );
    return { code: 0, data: { success: true } };
  }
}

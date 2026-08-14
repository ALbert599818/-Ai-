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
import { InsuranceService } from './insurance.service';

@Controller('api/insurance-coefficients')
@UseInterceptors(JwtRoleInterceptor)
export class InsuranceController {
  constructor(private readonly service: InsuranceService) {}

  @Get()
  async findAll(
    @Query('keyword') keyword?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.service.findAll({
      keyword: keyword || undefined,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
    });
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Post('import')
  async importItems(
    @Body() body: { items: Array<{ creditCondition: string; coefficient: string }> },
  ) {
    const result = await this.service.importItems(body.items || []);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Post()
  async create(
    @Body() body: { creditCondition: string; coefficient: number },
  ) {
    const result = await this.service.create(body);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { creditCondition: string; coefficient: number },
  ) {
    const result = await this.service.update(id, body);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.service.remove(id);
    return { code: 0, data: result };
  }
}

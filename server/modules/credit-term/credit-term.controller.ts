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
import { CreditTermService } from './credit-term.service';

@Controller('api/credit-terms')
@UseInterceptors(JwtRoleInterceptor)
export class CreditTermController {
  constructor(private readonly creditTermService: CreditTermService) {}

  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.creditTermService.findAll({
      category,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Post()
  async create(
    @Body()
    data: {
      category: string;
      subItem: string;
      discount: number;
    },
  ) {
    const result = await this.creditTermService.create(data);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body()
    data: {
      category: string;
      subItem: string;
      discount: number;
    },
  ) {
    const result = await this.creditTermService.update(id, data);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.creditTermService.remove(id);
    return { code: 0, data: result };
  }
}

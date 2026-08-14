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
import { MarginOldService } from './margin-old.service';
import type {
  CreateMarginOldRequest,
  UpdateMarginOldRequest,
  ImportMarginOldItem,
  ImportMarginOldResponse,
} from '@shared/margin-old';

@Controller('api/margins/old')
@UseInterceptors(JwtRoleInterceptor)
export class MarginOldController {
  constructor(
    private readonly marginOldService: MarginOldService,
  ) {}

  @Get()
  async findAll(
    @Query('keyword') keyword?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.marginOldService.findAll({
      keyword,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Post()
  async create(@Body() data: CreateMarginOldRequest) {
    const result = await this.marginOldService.create(data);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateMarginOldRequest,
  ) {
    const result = await this.marginOldService.update(id, data);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.marginOldService.remove(id);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Post('import')
  async importData(
    @Body() body: { items: ImportMarginOldItem[] },
  ): Promise<{ code: number; data: ImportMarginOldResponse }> {
    const result = await this.marginOldService.importData(body.items);
    return { code: 0, data: result };
  }
}

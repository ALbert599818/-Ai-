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
import { CustomFeeConfigService } from './custom-fee-config.service';
import type {
  CreateCustomFeeConfigRequest,
  UpdateCustomFeeConfigRequest,
  ImportCustomFeeConfigItem,
} from '@shared/custom-fee-config';

@Controller('api/custom-fee-configs')
@UseInterceptors(JwtRoleInterceptor)
export class CustomFeeConfigController {
  constructor(
    private readonly customFeeConfigService: CustomFeeConfigService,
  ) {}

  @Get()
  async findAll(
    @Query('keyword') keyword?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.customFeeConfigService.findAll({
      keyword,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Post()
  async create(@Body() data: CreateCustomFeeConfigRequest) {
    const result = await this.customFeeConfigService.create(data);
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Post('import')
  async importItems(
    @Body() body: { items: ImportCustomFeeConfigItem[] },
  ) {
    if (!body.items || !Array.isArray(body.items)) {
      return { code: 0, data: { success: false, imported: 0, skipped: 0, failed: 0, errors: [{ row: 0, message: '无效的导入数据' }] } };
    }
    const result = await this.customFeeConfigService.importItems(
      body.items,
    );
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateCustomFeeConfigRequest,
  ) {
    const result = await this.customFeeConfigService.update(
      id,
      data,
    );
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.customFeeConfigService.remove(id);
    return { code: 0, data: result };
  }
}

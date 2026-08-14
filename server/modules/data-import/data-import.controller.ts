import { Controller, Post, Delete, Body, Req } from '@nestjs/common';
import { NeedLogin } from '@server/lib/platform';
import { UseInterceptors } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { JwtRoleInterceptor } from '@server/common/guards/jwt-role.interceptor';
import { DataImportService } from './data-import.service';

const ADMIN_ROLES = ['admin', 'super_admin'];

@Controller('api/data-import')
@NeedLogin()
@UseInterceptors(JwtRoleInterceptor)
export class DataImportController {
  constructor(
    private readonly dataImportService: DataImportService,
  ) {}

  @Post('customers')
  async importCustomers(@Body() body: { file: string }) {
    return {
      code: 0,
      data: await this.dataImportService.importCustomers(body.file),
    };
  }

  @Post('after-sales-reserve')
  async importAfterSales(@Body() body: { file: string }) {
    return {
      code: 0,
      data: await this.dataImportService.importAfterSalesReserve(
        body.file,
      ),
    };
  }

  @Post('excess-marketing')
  async importExcessMarketing(@Body() body: { file: string }) {
    return {
      code: 0,
      data: await this.dataImportService.importExcessMarketingExpense(
        body.file,
      ),
    };
  }

  @Post('gross-margin-new')
  async importGrossMarginNew(@Body() body: { file: string }) {
    return {
      code: 0,
      data: await this.dataImportService.importGrossMarginNew(
        body.file,
      ),
    };
  }

  @Delete('clear/products')
  async clearProducts() {
    return {
      code: 0,
      data: await this.dataImportService.clearAllProducts(),
    };
  }

  @Delete('clear/customers')
  async clearCustomers() {
    return {
      code: 0,
      data: await this.dataImportService.clearAllCustomers(),
    };
  }

  @Delete('clear/margin-new')
  async clearMarginNew() {
    return {
      code: 0,
      data: await this.dataImportService.clearAllMarginNew(),
    };
  }

  @Delete('clear/after-sales')
  async clearAfterSales() {
    return {
      code: 0,
      data: await this.dataImportService.clearAllAfterSales(),
    };
  }

  @Delete('clear/excess-marketing')
  async clearExcessMarketing() {
    return {
      code: 0,
      data: await this.dataImportService.clearAllExcessMarketing(),
    };
  }

  @Post('seed')
  async seedDemoData(
    @Req() req: { userContext?: { roles?: string[] } },
  ) {
    const roles = req.userContext?.roles ?? [];
    const isAdmin = roles.some((r: string) =>
      ADMIN_ROLES.includes(r),
    );
    if (!isAdmin) {
      throw new BadRequestException('仅管理员可初始化示例数据');
    }
    return {
      code: 0,
      data: await this.dataImportService.seedDemoData(),
    };
  }
}

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
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { NeedLogin } from '@server/lib/platform';
import { UseInterceptors } from '@nestjs/common';
import { JwtRoleInterceptor } from '@server/common/guards/jwt-role.interceptor';
import { QuotationService } from './quotation.service';
import type {
  QuotationCalculateRequest,
  SaveQuotationRequest,
} from '@shared/quotation';

interface ReqWithUser {
  userContext: {
    userId: string;
    userName: string;
    region?: string;
    roles?: string[];
  };
}

@Controller('api/quotations')
@UseInterceptors(JwtRoleInterceptor)
export class QuotationController {
  private readonly logger = new Logger(QuotationController.name);

  constructor(private readonly quotationService: QuotationService) {}

  // ===== Static routes (must come before dynamic /:id) =====

  @Post('calculate')
  @NeedLogin()
  async calculate(
    @Body() request: QuotationCalculateRequest,
    @Req() req: ReqWithUser,
  ) {
    const { roles, region } = req.userContext;
    const isSuperAdmin = (roles ?? []).includes('super_admin');
    if (request.isNewCustomer && !isSuperAdmin) {
      request.grade = '无';
    }
    // 非超管用户提交时，region 强制为当前用户所属区域
    if (!isSuperAdmin && region) {
      request.region = region;
    }
    const result = await this.quotationService.calculate(request);
    return { code: 0, data: result };
  }

  @Post()
  @NeedLogin()
  async save(
    @Body() request: SaveQuotationRequest,
    @Req() req: ReqWithUser,
  ) {
    const { userId, userName, roles, region } = req.userContext;
    const isSuperAdmin = (roles ?? []).includes('super_admin');
    if (request.isNewCustomer && !isSuperAdmin) {
      request.grade = '无';
    }
    // 非超管用户提交时，region 强制为当前用户所属区域
    if (!isSuperAdmin && region) {
      request.region = region;
    }
    const result = await this.quotationService.save(
      request,
      userId,
      userName,
    );
    return { code: 0, data: result };
  }

  @Get()
  @NeedLogin()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
    @Req() req?: ReqWithUser,
  ) {
    const { userId, region, roles } = req?.userContext || {};
    this.logger.log(`findAll userContext: userId=${userId}, roles=${JSON.stringify(roles)}, region=${region}`);
    const result = await this.quotationService.findAll(
      {
        page: page ? parseInt(page, 10) : undefined,
        pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
        status,
        keyword,
      },
      userId,
      roles,
      region,
    );
    return { code: 0, data: result };
  }

  @Put(':id')
  @NeedLogin()
  async update(
    @Param('id') id: string,
    @Body() request: SaveQuotationRequest,
    @Req() req: ReqWithUser,
  ) {
    const { userId, userName, roles, region } = req.userContext;
    const isSuperAdmin = (roles ?? []).includes('super_admin');
    if (request.isNewCustomer && !isSuperAdmin) {
      request.grade = '无';
    }
    // 非超管用户提交时，region 强制为当前用户所属区域
    if (!isSuperAdmin && region) {
      request.region = region;
    }
    const result = await this.quotationService.update(
      id,
      request,
      userId,
      userName,
    );
    return { code: 0, data: result };
  }

  // ===== Dynamic routes =====

  @Get(':id')
  @NeedLogin()
  async findOne(@Param('id') id: string, @Req() req: ReqWithUser) {
    const { userId, roles, region } = req.userContext;
    const result = await this.quotationService.findOne(id, userId, roles, region);
    return { code: 0, data: result };
  }

  @Put(':id/submit')
  @NeedLogin()
  async submit(@Param('id') id: string, @Req() req: ReqWithUser) {
    const { userId, roles, region } = req.userContext;
    const result = await this.quotationService.submit(id, userId, roles, region);
    return { code: 0, data: result };
  }

  @Put(':id/approve')
  @NeedLogin()
  async approve(@Param('id') id: string) {
    const result = await this.quotationService.approve(id);
    return { code: 0, data: result };
  }

  @Put(':id/resubmit')
  @NeedLogin()
  async resubmit(@Param('id') id: string) {
    const result = await this.quotationService.resubmit(id);
    return { code: 0, data: result };
  }

  @Put(':id/reject')
  @NeedLogin()
  async reject(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    const result = await this.quotationService.reject(id, body.reason);
    return { code: 0, data: result };
  }

  @Delete(':id')
  @NeedLogin()
  async remove(@Param('id') id: string, @Req() req: ReqWithUser) {
    const { userId, roles, region } = req.userContext;
    const result = await this.quotationService.remove(id, userId, roles, region);
    return { code: 0, data: result };
  }
}

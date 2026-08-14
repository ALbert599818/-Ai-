import { Controller, Get, Query, Req } from '@nestjs/common';
import { NeedLogin } from '@server/lib/platform';
import { UseInterceptors } from '@nestjs/common';
import { JwtRoleInterceptor } from '@server/common/guards/jwt-role.interceptor';
import { MyCenterService } from './my-center.service';

@Controller('api/my')
@UseInterceptors(JwtRoleInterceptor)
export class MyCenterController {
  constructor(private readonly myCenterService: MyCenterService) {}

  @NeedLogin()
  @Get('quotations')
  async getMyQuotations(
    @Req() req: Request & { userContext: { userId: string } },
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
  ) {
    const { userId } = req.userContext;
    const data = await this.myCenterService.findByUser(userId, {
      status,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      keyword,
    });
    return { code: 0, data };
  }

  @NeedLogin()
  @Get('pending')
  async getMyPending(
    @Req() req: Request & { userContext: { userId: string } },
  ) {
    const { userId } = req.userContext;
    const data = await this.myCenterService.getMyPendingQuotations(userId);
    return { code: 0, data };
  }

  @NeedLogin()
  @Get('completed')
  async getMyCompleted(
    @Req() req: Request & { userContext: { userId: string } },
  ) {
    const { userId } = req.userContext;
    const data = await this.myCenterService.getMyCompletedQuotations(userId);
    return { code: 0, data };
  }

  @NeedLogin()
  @Get('drafts')
  async getMyDrafts(
    @Req() req: Request & { userContext: { userId: string } },
  ) {
    const { userId } = req.userContext;
    const data = await this.myCenterService.getMyDraftQuotations(userId);
    return { code: 0, data };
  }

  @NeedLogin()
  @Get('counts')
  async getStatusCounts(
    @Req() req: Request & { userContext: { userId: string } },
  ) {
    const { userId } = req.userContext;
    const data = await this.myCenterService.getStatusCounts(userId);
    return { code: 0, data };
  }
}

import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { NeedLogin } from '@server/lib/platform';
import { UseInterceptors } from '@nestjs/common';
import { JwtRoleInterceptor } from '@server/common/guards/jwt-role.interceptor';
import { UserAccountService } from './user-account.service';
import type {
  UpdateMyAccountRequest,
  ChangePasswordRequest,
  AdminUpdateUserRequest,
  EnsureAccountRequest,
  CreateTestAccountRequest,
} from '@shared/user-account';

interface ReqWithUser {
  userContext: {
    userId: string;
    userName: string;
    userNameI18n?: { zh_cn?: string; en_us?: string };
    roles?: string[];
  };
}

@Controller('api/user-account')
@NeedLogin()
@UseInterceptors(JwtRoleInterceptor)
export class UserAccountController {
  constructor(private readonly userAccountService: UserAccountService) {}

  @Get('me')
  async getMyAccount(@Req() req: ReqWithUser) {
    const { userId } = req.userContext;
    const data = await this.userAccountService.getMyAccount(userId);
    return { code: 0, data };
  }

  @Put('me')
  async updateMyAccount(
    @Req() req: ReqWithUser,
    @Body() body: UpdateMyAccountRequest,
  ) {
    const { userId } = req.userContext;
    const data = await this.userAccountService.updateMyAccount(userId, body);
    return { code: 0, data };
  }

  @Put('me/password')
  async changePassword(
    @Req() req: ReqWithUser,
    @Body() body: ChangePasswordRequest,
  ) {
    const { userId } = req.userContext;
    const data = await this.userAccountService.changePassword(
      userId,
      body.oldPassword,
      body.newPassword,
    );
    return { code: 0, data };
  }

  @Post('create-test')
  async createTestAccount(
    @Body() body: CreateTestAccountRequest,
  ) {
    const data = await this.userAccountService.createTestAccount(body);
    return { code: 0, data };
  }

  @Get('list')
  async listUsers(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('region') region?: string,
  ) {
    const data = await this.userAccountService.listUsers({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      keyword,
      region,
    });
    return { code: 0, data };
  }

  @Post('ensure')
  async ensureAccount(@Req() req: ReqWithUser) {
    const { userId, userName } = req.userContext;
    const body: EnsureAccountRequest = { userId, displayName: userName };
    const data = await this.userAccountService.ensureAccount(
      body.userId,
      body.displayName,
      body.email,
    );
    return { code: 0, data };
  }

  @Get(':userId')
  async getUserDetail(@Param('userId') targetUserId: string) {
    const data = await this.userAccountService.getUserDetail(targetUserId);
    return { code: 0, data };
  }

  @Put(':userId')
  async adminUpdateUser(
    @Param('userId') targetUserId: string,
    @Body() body: AdminUpdateUserRequest,
  ) {
    const data = await this.userAccountService.adminUpdateUser(
      targetUserId,
      body,
    );
    return { code: 0, data };
  }

  @Delete(':userId')
  async deleteUser(@Param('userId') targetUserId: string) {
    const data = await this.userAccountService.deleteUser(targetUserId);
    return { code: 0, data };
  }
}

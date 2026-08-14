import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Headers,
} from '@nestjs/common';
import { NeedLogin } from '@server/lib/platform';
import { AuthService } from './auth.service';
import type { LoginRequest } from '@shared/auth';

interface ReqWithUser {
  userContext?: {
    userId: string;
    tenantId: string;
    userName?: string;
    email?: string;
  };
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('issue-token')
  @NeedLogin()
  async issueToken(@Req() req: ReqWithUser) {
    const { userId, tenantId, userName, email } = req.userContext || {};
    if (!userId || !tenantId) {
      return { code: 401, error: { message: '无法获取用户信息' } };
    }
    const data = await this.authService.issueTokenFromFeishu(
      userId,
      tenantId,
      userName,
      email,
    );
    return { code: 0, data };
  }

  @Post('login')
  async login(@Body() body: LoginRequest) {
    const data = await this.authService.login(body.username, body.password);
    return { code: 0, data };
  }

  @Get('session')
  async getSession(
    @Headers('authorization') authHeader: string,
    @Headers('x-auth-token') customToken: string,
  ) {
    const token = authHeader?.replace('Bearer ', '') || customToken;
    if (!token) {
      return { code: 401, error: { message: '未登录' } };
    }
    const data = await this.authService.getSession(token);
    return { code: 0, data };
  }
}

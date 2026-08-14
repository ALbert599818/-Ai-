import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@server/common/constants/jwt';

interface JwtPayload {
  userId: string;
  username: string;
  displayName: string;
  region: string;
  roles: string[];
}

function extractToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '');
  }
  const customToken = req.headers['x-auth-token'] as string | undefined;
  return customToken;
}

@Injectable()
export class NeedLoginGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { userContext?: JwtPayload }>();

    // 守卫先于拦截器执行，这里自行解析 JWT 填充 userContext，
    // 保持与平台版一致：登录后 request.userContext 可用。
    if (!request.userContext?.userId) {
      const token = extractToken(request);
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
          request.userContext = {
            userId: decoded.userId,
            username: decoded.username,
            displayName: decoded.displayName,
            region: decoded.region,
            roles: decoded.roles,
          };
        } catch {
          // 非法 token，走下面的未登录判断
        }
      }
    }

    if (!request.userContext?.userId) {
      throw new UnauthorizedException('未登录或登录已过期');
    }
    return true;
  }
}

export function NeedLogin() {
  return applyDecorators(UseGuards(NeedLoginGuard));
}

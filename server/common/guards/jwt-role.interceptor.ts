import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import * as jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@server/common/constants/jwt';

interface JwtPayload {
  roles?: string[];
  userId?: string;
}

/**
 * 解析 Authorization Header 中的 JWT，将 payload.roles 注入到
 * req.userContext.roles，以便后续业务代码与 @CanRole 等基于
 * userContext.roles 的鉴权机制能够识别用户在应用内拥有的角色。
 *
 * 仅当请求头中存在合法 JWT 且其中包含 roles 时才覆盖；
 * 否则保留平台已注入的 roles。无 roles 时放行，由 @NeedLogin() 处理鉴权。
 */
@Injectable()
export class JwtRoleInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const userContext = request.userContext || {};

    const authHeader: string | undefined =
      request.headers?.['authorization'] || request.headers?.['Authorization'];
    const token =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : undefined;

    let jwtRoles: string[] | undefined;
    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
        if (Array.isArray(payload.roles)) {
          jwtRoles = payload.roles;
        }
      } catch {
        jwtRoles = undefined;
      }
    }

    const existingRoles: string[] = Array.isArray(userContext.roles)
      ? userContext.roles
      : [];
    const mergedRoles =
      jwtRoles && jwtRoles.length > 0 ? jwtRoles : existingRoles;

    request.userContext = {
      ...userContext,
      roles: mergedRoles,
    };

    return next.handle();
  }
}

import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = 'miaoda-quotation-jwt-secret-2024';

@Injectable()
export class JwtAuthInterceptor implements NestInterceptor {
  private readonly logger = new Logger(JwtAuthInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    const customToken = request.headers['x-auth-token'] as string | undefined;
    const url = request.url;

    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.replace('Bearer ', '')
      : customToken;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as {
          userId: string;
          username: string;
          displayName: string;
          region: string;
          roles: string[];
        };
        request.userContext = {
          userId: decoded.userId,
          userName: decoded.displayName,
          region: decoded.region,
          roles: decoded.roles,
        };
        this.logger.log(`JWT parsed OK for ${url}: userId=${decoded.userId}, roles=${JSON.stringify(decoded.roles)}, region=${decoded.region}`);
      } catch (err) {
        this.logger.warn(`JWT verify failed for ${url}: ${err instanceof Error ? err.message : 'unknown'}`);
      }
    } else {
      this.logger.log(`No JWT token for ${url}, using platform userContext: userId=${request.userContext?.userId}`);
    }

    return next.handle();
  }
}

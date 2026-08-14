import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = 'miaoda-quotation-jwt-secret-2024';

@Injectable()
export class CustomAuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as {
          userId: string;
          username: string;
          displayName: string;
          region: string;
          roles: string[];
        };
        (req as any).userContext = {
          userId: decoded.userId,
          userName: decoded.displayName,
          region: decoded.region,
          roles: decoded.roles,
        };
      } catch {
        // Token invalid - let platform middleware handle
      }
    }
    next();
  }
}

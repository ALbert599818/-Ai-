import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@server/lib/platform';
import { userAccount } from '@server/database/schema';
import { eq } from 'drizzle-orm';
import { createHash, randomBytes } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { UserAccountService } from '../user-account/user-account.service';
import { JWT_SECRET } from '@server/common/constants/jwt';
import type { LoginResponse, SessionResponse } from '@shared/auth';

const ALLOWED_TENANT_IDS = ['456368'];

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(salt + password).digest('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const computed = createHash('sha256').update(salt + password).digest('hex');
  return computed === hash;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE)
    private readonly db: PostgresJsDatabase,
    private readonly userAccountService: UserAccountService,
  ) {}

  async login(
    username: string,
    password: string,
  ): Promise<LoginResponse> {
    const rows = await this.db
      .select()
      .from(userAccount)
      .where(eq(userAccount.username, username))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('用户名或密码错误');
    }

    const row = rows[0];

    if (!row.isActive) {
      throw new BadRequestException('账号已被禁用');
    }

    if (!verifyPassword(password, row.passwordHash)) {
      throw new NotFoundException('用户名或密码错误');
    }

    const payload = {
      userId: row.userId,
      username: row.username,
      displayName: row.displayName,
      region: row.region,
      roles: row.roles as string[],
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    this.logger.log(`User logged in: ${username}`);

    return {
      token,
      user: {
        userId: payload.userId,
        username: payload.username,
        displayName: payload.displayName,
        region: payload.region,
        roles: payload.roles,
      },
    };
  }

  async issueTokenFromFeishu(
    userId: string,
    tenantId: string,
    displayName?: string,
    email?: string,
  ): Promise<LoginResponse> {
    if (!ALLOWED_TENANT_IDS.includes(String(tenantId))) {
      throw new UnauthorizedException('未授权登录');
    }

    const account = await this.userAccountService.ensureAccount(
      userId,
      displayName,
      email,
    );

    if (!account.isActive) {
      throw new BadRequestException('账号已被禁用');
    }

    const payload = {
      userId: account.userId,
      username: account.username,
      displayName: account.displayName,
      region: account.region,
      roles: account.roles as string[],
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    this.logger.log(`Feishu SSO login: ${account.userId}`);

    return {
      token,
      user: {
        userId: payload.userId,
        username: payload.username,
        displayName: payload.displayName,
        region: payload.region,
        roles: payload.roles,
      },
    };
  }

  async getSession(token: string): Promise<SessionResponse> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as SessionResponse;
      return {
        userId: decoded.userId,
        username: decoded.username,
        displayName: decoded.displayName,
        region: decoded.region,
        roles: decoded.roles,
      };
    } catch {
      throw new UnauthorizedException('登录已过期，请重新登录');
    }
  }
}

import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@server/lib/platform';
import { userAccount } from '@server/database/schema';
import { and, or, count, desc, like, eq, sql } from 'drizzle-orm';
import { createHash, randomBytes } from 'crypto';
import type {
  UserAccountInfo,
  UserAccountDetail,
  UpdateMyAccountRequest,
  AdminUpdateUserRequest,
  UserAccountListParams,
  UserAccountListResponse,
  CreateTestAccountRequest,
} from '@shared/user-account';

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
export class UserAccountService {
  private readonly logger = new Logger(UserAccountService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE)
    private readonly db: PostgresJsDatabase,
  ) {}

  private toAccountInfo(row: Record<string, unknown>): UserAccountInfo {
    return {
      id: row.id as string,
      userId: row.userId as string,
      username: (row.username as string) || '',
      displayName: (row.displayName as string) || '',
      account: (row.username as string) || '',
      region: (row.region as string) || '',
      email: (row.email as string) || '',
      phone: (row.phone as string) || '',
      roles: (row.roles as string[]) || [],
      isActive: (row.isActive as boolean) ?? true,
      createdAt: row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt || ''),
      updatedAt: row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : String(row.updatedAt || ''),
    };
  }

  private toAccountDetail(row: Record<string, unknown>): UserAccountDetail {
    return {
      ...this.toAccountInfo(row),
      passwordHash: row.passwordHash as string,
    };
  }

  async ensureAccount(
    userId: string,
    displayName?: string,
    email?: string,
    defaultRoles?: string[],
  ): Promise<UserAccountInfo> {
    const existing = await this.db
      .select()
      .from(userAccount)
      .where(sql`(${userAccount.userId}).user_id = ${userId}`)
      .limit(1);

    if (existing.length > 0) {
      const row = existing[0];
      const currentRoles = (row.roles as string[]) || [];
      if (currentRoles.length === 0) {
        const upgraded = await this.tryUpgradeFirstAccount(userId, row.id);
        if (upgraded) {
          return upgraded;
        }
      }
      return this.toAccountInfo(row);
    }

    const defaultPassword = hashPassword('default123');
    const name = displayName || userId;
    let roles = defaultRoles ?? [];

    if (roles.length === 0) {
      const totalResult = await this.db
        .select({ count: count() })
        .from(userAccount);
      const totalCount = Number(totalResult[0]?.count ?? 0);
      if (totalCount === 0) {
        roles = ['super_admin'];
        this.logger.log(
          `First account created for user: ${userId}, auto-granted super_admin`,
        );
      }
    }

    const inserted = await this.db
      .insert(userAccount)
      .values({
        userId,
        username: name,
        passwordHash: defaultPassword,
        displayName: name,
        region: '其他',
        email: email || '',
        phone: '',
        roles,
      })
      .returning();

    this.logger.log(`Created account for user: ${userId} with roles: ${roles.join(',')}`);
    return this.toAccountInfo(inserted[0]);
  }

  async getMyAccount(userId: string): Promise<UserAccountInfo> {
    const rows = await this.db
      .select()
      .from(userAccount)
      .where(sql`(${userAccount.userId}).user_id = ${userId}`)
      .limit(1);

    if (rows.length === 0) {
      return this.ensureAccount(userId);
    }

    const row = rows[0];
    const currentRoles = (row.roles as string[]) || [];
    if (currentRoles.length === 0) {
      const upgraded = await this.tryUpgradeFirstAccount(userId, row.id);
      if (upgraded) {
        return upgraded;
      }
    }

    return this.toAccountInfo(row);
  }

  private async tryUpgradeFirstAccount(
    userId: string,
    rowId: unknown,
  ): Promise<UserAccountInfo | null> {
    const earliest = await this.db
      .select()
      .from(userAccount)
      .orderBy(userAccount.createdAt)
      .limit(1);
    const earliestRow = earliest[0];
    if (
      earliestRow &&
      String(earliestRow.id) === String(rowId) &&
      ((earliestRow.roles as string[]) || []).length === 0
    ) {
      const upgraded = await this.db
        .update(userAccount)
        .set({ roles: ['super_admin'] })
        .where(sql`(${userAccount.userId}).user_id = ${userId}`)
        .returning();
      this.logger.log(
        `Auto-promoted first account to super_admin: ${userId}`,
      );
      return this.toAccountInfo(upgraded[0]);
    }
    return null;
  }

  async updateMyAccount(
    userId: string,
    data: UpdateMyAccountRequest,
  ): Promise<UserAccountInfo> {
    const updateFields: Record<string, string> = {};
    if (data.displayName !== undefined) {
      updateFields.displayName = data.displayName;
    }
    if (data.email !== undefined) {
      updateFields.email = data.email;
    }
    if (data.phone !== undefined) {
      updateFields.phone = data.phone;
    }

    if (Object.keys(updateFields).length === 0) {
      return this.getMyAccount(userId);
    }

    const updated = await this.db
      .update(userAccount)
      .set(updateFields)
      .where(sql`(${userAccount.userId}).user_id = ${userId}`)
      .returning();

    if (updated.length === 0) {
      throw new NotFoundException('用户账户不存在');
    }

    this.logger.log(`Updated account for user: ${userId}`);
    return this.toAccountInfo(updated[0]);
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean }> {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('新密码长度不能少于6位');
    }

    const rows = await this.db
      .select({ passwordHash: userAccount.passwordHash })
      .from(userAccount)
      .where(sql`(${userAccount.userId}).user_id = ${userId}`)
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('用户账户不存在');
    }

    if (!verifyPassword(oldPassword, rows[0].passwordHash)) {
      throw new BadRequestException('旧密码不正确');
    }

    const newHash = hashPassword(newPassword);
    await this.db
      .update(userAccount)
      .set({ passwordHash: newHash })
      .where(sql`(${userAccount.userId}).user_id = ${userId}`);

    this.logger.log(`Password changed for user: ${userId}`);
    return { success: true };
  }

  async createTestAccount(
    data: CreateTestAccountRequest,
  ): Promise<UserAccountInfo> {
    const testUserId = `test_${randomBytes(8).toString('hex')}`;

    const ALLOWED_TEST_ROLES = ['quotation_editor', 'admin', 'super_admin'];
    const roles = data.role ? [data.role] : ['quotation_editor'];
    for (const role of roles) {
      if (!ALLOWED_TEST_ROLES.includes(role)) {
        throw new BadRequestException(`测试账号不允许分配角色: ${role}，只允许: ${ALLOWED_TEST_ROLES.join(', ')}`);
      }
    }

    const existing = await this.db
      .select({ id: userAccount.id })
      .from(userAccount)
      .where(eq(userAccount.username, data.username))
      .limit(1);

    if (existing.length > 0) {
      throw new BadRequestException(`用户名 "${data.username}" 已存在`);
    }

    const inserted = await this.db
      .insert(userAccount)
      .values({
        userId: testUserId,
        username: data.username,
        passwordHash: hashPassword(data.password),
        displayName: data.displayName,
        region: data.region || '其他',
        email: '',
        phone: '',
        roles,
      })
      .returning();

    this.logger.log(`Created test account: ${data.username} (${testUserId})`);
    return this.toAccountInfo(inserted[0]);
  }

  async listUsers(params: UserAccountListParams): Promise<UserAccountListResponse> {
    const { page = 1, pageSize = 20, keyword, region } = params;

    const conditions = [];
    if (keyword) {
      conditions.push(
        or(
          like(userAccount.username, `%${keyword}%`),
          like(userAccount.displayName, `%${keyword}%`),
          like(userAccount.email, `%${keyword}%`),
        ),
      );
    }
    if (region) {
      conditions.push(eq(userAccount.region, region));
    }

    const whereClause = conditions.length > 0
      ? and(...conditions)
      : undefined;

    const totalResult = await this.db
      .select({ count: count() })
      .from(userAccount)
      .where(whereClause);
    const total = Number(totalResult[0]?.count ?? 0);

    const rows = await this.db
      .select()
      .from(userAccount)
      .where(whereClause)
      .orderBy(desc(userAccount.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return {
      items: rows.map((row) => this.toAccountDetail(row)),
      total,
      page,
      pageSize,
    };
  }

  async getUserDetail(targetUserId: string): Promise<UserAccountDetail> {
    const rows = await this.db
      .select()
      .from(userAccount)
      .where(sql`(${userAccount.userId}).user_id = ${targetUserId}`)
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('用户账户不存在');
    }
    return this.toAccountDetail(rows[0]);
  }

  async adminUpdateUser(
    targetUserId: string,
    data: AdminUpdateUserRequest,
  ): Promise<UserAccountInfo> {
    const updateFields: Record<string, unknown> = {};
    if (data.region !== undefined) {
      updateFields.region = data.region;
    }
    if (data.account !== undefined) {
      updateFields.username = data.account;
    }
    if (data.displayName !== undefined) {
      updateFields.displayName = data.displayName;
    }
    if (data.email !== undefined) {
      updateFields.email = data.email;
    }
    if (data.phone !== undefined) {
      updateFields.phone = data.phone;
    }
    if (data.passwordHash !== undefined) {
      updateFields.passwordHash = hashPassword(data.passwordHash);
    }
    if (data.roles !== undefined) {
      updateFields.roles = data.roles;
    }
    if (data.isActive !== undefined) {
      updateFields.isActive = data.isActive;
    }

    if (Object.keys(updateFields).length === 0) {
      return this.getUserDetail(targetUserId);
    }

    const updated = await this.db
      .update(userAccount)
      .set(updateFields)
      .where(sql`(${userAccount.userId}).user_id = ${targetUserId}`)
      .returning();

    if (updated.length === 0) {
      throw new NotFoundException('用户账户不存在');
    }

    this.logger.log(
      `Admin updated account for user: ${targetUserId}`,
    );
    return this.toAccountInfo(updated[0]);
  }

  async deleteUser(targetUserId: string): Promise<{ success: boolean }> {
    const deleted = await this.db
      .delete(userAccount)
      .where(sql`(${userAccount.userId}).user_id = ${targetUserId}`)
      .returning({ id: userAccount.id });

    if (deleted.length === 0) {
      throw new NotFoundException('用户账户不存在');
    }

    this.logger.log(`Deleted account for user: ${targetUserId}`);
    return { success: true };
  }
}

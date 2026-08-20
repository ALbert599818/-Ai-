import { count } from 'drizzle-orm';
import { createHash, randomBytes } from 'crypto';
import { userAccount } from './schema';
import type { PostgresJsDatabase } from '@server/lib/platform/database';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(salt + password).digest('hex');
  return `${salt}:${hash}`;
}

/**
 * 首次启动时若账号表为空，则播种一个默认超级管理员。
 * 用户名/密码可通过环境变量 ADMIN_USERNAME / ADMIN_PASSWORD 覆盖。
 */
export async function seedAdmin(db: PostgresJsDatabase): Promise<void> {
  const result = await db.select({ count: count() }).from(userAccount);
  if (Number(result[0]?.count ?? 0) > 0) {
    return;
  }

  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin';

  await db.insert(userAccount).values({
    userId: 'admin-user',
    username,
    passwordHash: hashPassword(password),
    displayName: '管理员',
    region: '其他',
    email: '',
    phone: '',
    roles: ['super_admin'],
  });
}

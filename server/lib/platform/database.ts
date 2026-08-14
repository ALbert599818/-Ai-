import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase as DrizzlePostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';
import * as schema from '@server/database/schema';

/** 数据库连接注入 token（供各 service 注入 Drizzle 实例） */
export const DRIZZLE_DATABASE = Symbol('DRIZZLE_DATABASE');

/** 底层 postgres-js 客户端 token（供启动时执行建表/迁移 SQL） */
export const DATABASE_CLIENT = Symbol('DATABASE_CLIENT');

/** 与飞书平台一致的 Drizzle 数据库类型 */
export type PostgresJsDatabase = DrizzlePostgresJsDatabase<typeof schema>;

export function createPostgresClient(databaseUrl: string): Sql {
  return postgres(databaseUrl, {
    max: 10,
    prepare: false,
    connect_timeout: 5,
  });
}

export function createDrizzleDatabase(client: Sql): PostgresJsDatabase {
  return drizzle(client, { schema });
}

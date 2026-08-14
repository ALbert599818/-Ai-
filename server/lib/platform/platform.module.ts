import {
  Global,
  Inject,
  Injectable,
  Logger,
  Module,
  OnApplicationBootstrap,
} from '@nestjs/common';
import type { Sql } from 'postgres';
import {
  DATABASE_CLIENT,
  DRIZZLE_DATABASE,
  createDrizzleDatabase,
  createPostgresClient,
  type PostgresJsDatabase,
} from './database';
import { INIT_SQL_STATEMENTS } from '@server/database/init-sql';
import { seedAdmin } from '@server/database/seed';

@Global()
@Module({})
export class PlatformModule {
  static forRoot(_options?: { authz?: unknown }) {
    return {
      module: PlatformModule,
      providers: [
        {
          provide: DATABASE_CLIENT,
          useFactory: (): Sql => {
            const url = process.env.DATABASE_URL;
            if (!url) {
              throw new Error(
                '缺少环境变量 DATABASE_URL，请在项目根目录 .env 中配置数据库连接地址',
              );
            }
            return createPostgresClient(url);
          },
        },
        {
          provide: DRIZZLE_DATABASE,
          useFactory: (client: Sql) => createDrizzleDatabase(client),
          inject: [DATABASE_CLIENT],
        },
        DatabaseInitializer,
      ],
      exports: [DRIZZLE_DATABASE],
    };
  }
}

@Injectable()
class DatabaseInitializer implements OnApplicationBootstrap {
  private readonly logger = new Logger('DatabaseInit');

  constructor(
    @Inject(DATABASE_CLIENT) private readonly client: Sql,
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  onApplicationBootstrap(): void {
    // 后台初始化，不阻塞 HTTP 服务启动；失败仅记录日志。
    void this.initDatabase();
  }

  private async initDatabase(): Promise<void> {
    try {
      for (const stmt of INIT_SQL_STATEMENTS) {
        await this.client.unsafe(stmt);
      }
      this.logger.log('数据库结构已就绪');

      await seedAdmin(this.db);
      this.logger.log('数据库初始化完成');
    } catch (err) {
      this.logger.error(
        '数据库初始化失败，请检查 DATABASE_URL 是否可连通：' +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  }
}

import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@server/lib/platform';
import { customerLevel } from '@server/database/schema';
import { eq, and, count, desc, like } from 'drizzle-orm';

@Injectable()
export class CustomerLevelService {
  private readonly logger = new Logger(CustomerLevelService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE)
    private readonly db: PostgresJsDatabase,
  ) {}

  async findAll(params: {
    keyword?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { keyword, page = 1, pageSize = 20 } = params;

    const conditions = [];
    if (keyword) {
      conditions.push(like(customerLevel.name, `%${keyword}%`));
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const totalResult = await this.db
      .select({ count: count() })
      .from(customerLevel)
      .where(whereClause);

    const total = Number(totalResult[0]?.count ?? 0);

    const offset = (page - 1) * pageSize;

    const items = await this.db
      .select({
        id: customerLevel.id,
        name: customerLevel.name,
        discount: customerLevel.discount,
        createdAt: customerLevel.createdAt,
        updatedAt: customerLevel.updatedAt,
      })
      .from(customerLevel)
      .where(whereClause)
      .orderBy(desc(customerLevel.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      items: items.map((item) => ({
        ...item,
        discount: Number(item.discount),
      })),
      total,
    };
  }

  async create(data: { name: string; discount: number }) {
    try {
      const result = await this.db
        .insert(customerLevel)
        .values({
          name: data.name,
          discount: String(data.discount),
        })
        .returning({ id: customerLevel.id });

      return { id: result[0].id };
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message.includes('duplicate key')
      ) {
        this.logger.warn(
          `Duplicate customer level name: ${data.name}`,
        );
        throw new ConflictException(
          `等级名称 "${data.name}" 已存在`,
        );
      }
      throw error;
    }
  }

  async update(
    id: string,
    data: { name: string; discount: number },
  ) {
    try {
      const result = await this.db
        .update(customerLevel)
        .set({
          name: data.name,
          discount: String(data.discount),
        })
        .where(eq(customerLevel.id, id))
        .returning({ id: customerLevel.id });

      if (result.length === 0) {
        throw new NotFoundException(
          `客户等级 ${id} 不存在`,
        );
      }

      return { success: true };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (
        error instanceof Error &&
        error.message.includes('duplicate key')
      ) {
        this.logger.warn(
          `Duplicate customer level name: ${data.name}`,
        );
        throw new ConflictException(
          `等级名称 "${data.name}" 已存在`,
        );
      }
      throw error;
    }
  }

  async remove(id: string) {
    const result = await this.db
      .delete(customerLevel)
      .where(eq(customerLevel.id, id))
      .returning({ id: customerLevel.id });

    if (result.length === 0) {
      throw new NotFoundException(
        `客户等级 ${id} 不存在`,
      );
    }

    return { success: true };
  }
}

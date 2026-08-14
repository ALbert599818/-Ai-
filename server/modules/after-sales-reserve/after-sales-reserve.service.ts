import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@server/lib/platform';
import { afterSalesReserve } from '@server/database/schema';
import { eq, and, count, desc, like } from 'drizzle-orm';

@Injectable()
export class AfterSalesReserveService {
  private readonly logger = new Logger(
    AfterSalesReserveService.name,
  );

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
      conditions.push(
        like(
          afterSalesReserve.customerShortName,
          `%${keyword}%`,
        ),
      );
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const totalResult = await this.db
      .select({ count: count() })
      .from(afterSalesReserve)
      .where(whereClause);

    const total = Number(totalResult[0]?.count ?? 0);

    const offset = (page - 1) * pageSize;

    const items = await this.db
      .select()
      .from(afterSalesReserve)
      .where(whereClause)
      .orderBy(desc(afterSalesReserve.createdAt))
      .limit(pageSize)
      .offset(offset);

    const mappedItems = items.map((item) => ({
      id: item.id,
      customerShortName: item.customerShortName,
      rate: Number(item.rate),
      createdAt:
        item.createdAt instanceof Date
          ? item.createdAt.toISOString()
          : String(item.createdAt),
      updatedAt:
        item.updatedAt instanceof Date
          ? item.updatedAt.toISOString()
          : String(item.updatedAt),
    }));

    return { items: mappedItems, total };
  }

  async create(data: {
    customerShortName: string;
    rate: number;
  }) {
    try {
      const result = await this.db
        .insert(afterSalesReserve)
        .values({
          customerShortName: data.customerShortName,
          rate: String(data.rate),
        })
        .returning({ id: afterSalesReserve.id });

      if (result.length === 0) {
        throw new NotFoundException(
          '创建售后准备金率失败',
        );
      }

      return { id: result[0].id };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('duplicate key')
      ) {
        throw new ConflictException(
          `客户简称「${data.customerShortName}」已存在`,
        );
      }
      this.logger.error(
        '创建售后准备金率失败',
        JSON.stringify(error),
      );
      throw error;
    }
  }

  async update(
    id: string,
    data: { customerShortName: string; rate: number },
  ) {
    try {
      const result = await this.db
        .update(afterSalesReserve)
        .set({
          customerShortName: data.customerShortName,
          rate: String(data.rate),
        })
        .where(eq(afterSalesReserve.id, id))
        .returning({ id: afterSalesReserve.id });

      if (result.length === 0) {
        throw new NotFoundException(
          `售后准备金率 ${id} 不存在`,
        );
      }

      return { success: true };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('duplicate key')
      ) {
        throw new ConflictException(
          `客户简称「${data.customerShortName}」已存在`,
        );
      }
      this.logger.error(
        `更新售后准备金率 ${id} 失败`,
        JSON.stringify(error),
      );
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const result = await this.db
        .delete(afterSalesReserve)
        .where(eq(afterSalesReserve.id, id))
        .returning({ id: afterSalesReserve.id });

      if (result.length === 0) {
        throw new NotFoundException(
          `售后准备金率 ${id} 不存在`,
        );
      }

      return { success: true };
    } catch (error) {
      this.logger.error(
        `删除售后准备金率 ${id} 失败`,
        JSON.stringify(error),
      );
      throw error;
    }
  }
}

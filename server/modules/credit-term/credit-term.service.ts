import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@server/lib/platform';
import { creditTerm } from '@server/database/schema';
import { eq, and, count, asc } from 'drizzle-orm';

@Injectable()
export class CreditTermService {
  private readonly logger = new Logger(CreditTermService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async findAll(params: {
    category?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { category, page = 1, pageSize = 20 } = params;

    const conditions = [];
    if (category) {
      conditions.push(eq(creditTerm.category, category));
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const totalResult = await this.db
      .select({ count: count() })
      .from(creditTerm)
      .where(whereClause);

    const total = Number(totalResult[0]?.count ?? 0);

    const offset = (page - 1) * pageSize;

    const items = await this.db
      .select()
      .from(creditTerm)
      .where(whereClause)
      .orderBy(asc(creditTerm.category), asc(creditTerm.subItem))
      .limit(pageSize)
      .offset(offset);

    const mappedItems = items.map((item) => ({
      id: item.id,
      category: item.category,
      subItem: item.subItem,
      discount: Number(item.discount),
      createdAt: item.createdAt instanceof Date
        ? item.createdAt.toISOString()
        : String(item.createdAt),
      updatedAt: item.updatedAt instanceof Date
        ? item.updatedAt.toISOString()
        : String(item.updatedAt),
    }));

    return { items: mappedItems, total };
  }

  async create(data: {
    category: string;
    subItem: string;
    discount: number;
  }) {
    try {
      const result = await this.db
        .insert(creditTerm)
        .values({
          category: data.category,
          subItem: data.subItem,
          discount: String(data.discount),
        })
        .returning({ id: creditTerm.id });

      if (result.length === 0) {
        throw new NotFoundException('创建信用条件失败');
      }

      return { id: result[0].id };
    } catch (error) {
      this.logger.error('创建信用条件失败', JSON.stringify(error));
      throw error;
    }
  }

  async update(
    id: string,
    data: {
      category: string;
      subItem: string;
      discount: number;
    },
  ) {
    try {
      const result = await this.db
        .update(creditTerm)
        .set({
          category: data.category,
          subItem: data.subItem,
          discount: String(data.discount),
        })
        .where(eq(creditTerm.id, id))
        .returning({ id: creditTerm.id });

      if (result.length === 0) {
        throw new NotFoundException(`信用条件 ${id} 不存在`);
      }

      return { success: true };
    } catch (error) {
      this.logger.error(
        `更新信用条件 ${id} 失败`,
        JSON.stringify(error),
      );
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const result = await this.db
        .delete(creditTerm)
        .where(eq(creditTerm.id, id))
        .returning({ id: creditTerm.id });

      if (result.length === 0) {
        throw new NotFoundException(`信用条件 ${id} 不存在`);
      }

      return { success: true };
    } catch (error) {
      this.logger.error(
        `删除信用条件 ${id} 失败`,
        JSON.stringify(error),
      );
      throw error;
    }
  }
}

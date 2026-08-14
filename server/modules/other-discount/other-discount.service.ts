import { Injectable, Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/lib/platform';
import { otherDiscount } from '@server/database/schema';
import { eq, like, and, count, desc } from 'drizzle-orm';

@Injectable()
export class OtherDiscountService {
  private readonly logger = new Logger(OtherDiscountService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async findAll(params: { keyword?: string; page?: number; pageSize?: number }) {
    const { keyword, page = 1, pageSize = 20 } = params;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (keyword) {
      conditions.push(like(otherDiscount.discountType, `%${keyword}%`));
    }

    const query = conditions.length > 0
      ? this.db.select().from(otherDiscount).where(and(...conditions))
      : this.db.select().from(otherDiscount);

    const items = await query
      .orderBy(desc(otherDiscount.createdAt))
      .limit(pageSize)
      .offset(offset);

    const countQuery = conditions.length > 0
      ? this.db.select({ count: count() }).from(otherDiscount).where(and(...conditions))
      : this.db.select({ count: count() }).from(otherDiscount);

    const [countResult] = await countQuery;
    const total = Number(countResult.count);

    return {
      items: items.map((item) => ({
        id: item.id,
        discountType: item.discountType,
        discount: Number(item.discount),
        createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt),
        updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : String(item.updatedAt),
      })),
      total,
    };
  }

  async create(data: { discountType: string; discount: number }) {
    if (!data.discountType) {
      throw new BadRequestException('折扣类型不能为空');
    }

    const [result] = await this.db
      .insert(otherDiscount)
      .values({
        discountType: data.discountType,
        discount: String(data.discount),
      })
      .returning();

    if (!result) {
      throw new BadRequestException('创建失败');
    }

    return { id: result.id };
  }

  async update(id: string, data: { discountType: string; discount: number }) {
    if (!data.discountType) {
      throw new BadRequestException('折扣类型不能为空');
    }

    const [result] = await this.db
      .update(otherDiscount)
      .set({
        discountType: data.discountType,
        discount: String(data.discount),
      })
      .where(eq(otherDiscount.id, id))
      .returning();

    if (!result) {
      throw new NotFoundException('未找到该折扣类型');
    }

    return { success: true };
  }

  async remove(id: string) {
    const [result] = await this.db
      .delete(otherDiscount)
      .where(eq(otherDiscount.id, id))
      .returning({ id: otherDiscount.id });

    if (!result) {
      throw new NotFoundException('未找到该折扣类型');
    }

    return { success: true };
  }
}

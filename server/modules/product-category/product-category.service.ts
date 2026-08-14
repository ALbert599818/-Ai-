import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@server/lib/platform';
import { productCategory, product, productGradeMargin, customerCategoryGrade } from '@server/database/schema';
import { eq, asc, ilike, or } from 'drizzle-orm';
import type { ProductCategoryItem } from '@shared/product-category';

@Injectable()
export class ProductCategoryService {
  private readonly logger = new Logger(ProductCategoryService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE)
    private readonly db: PostgresJsDatabase,
  ) {}

  async findAll(): Promise<{ items: ProductCategoryItem[] }> {
    const rows = await this.db
      .select({
        id: productCategory.id,
        name: productCategory.name,
        defaultGrade: productCategory.defaultGrade,
        sortOrder: productCategory.sortOrder,
        createdAt: productCategory.createdAt,
        updatedAt: productCategory.updatedAt,
      })
      .from(productCategory)
      .orderBy(asc(productCategory.sortOrder), asc(productCategory.name));

    return { items: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })) };
  }

  async create(data: { name: string; defaultGrade?: string; sortOrder?: number }) {
    const name = data.name.trim();
    if (!name) {
      throw new BadRequestException('品类名称不能为空');
    }
    if (name.length > 100) {
      throw new BadRequestException('品类名称长度不能超过100');
    }
    try {
      const result = await this.db
        .insert(productCategory)
        .values({
          name,
          defaultGrade: data.defaultGrade || '无',
          sortOrder: data.sortOrder ?? 0,
        })
        .returning({ id: productCategory.id });
      return { id: result[0].id };
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message.includes('duplicate key')
      ) {
        throw new ConflictException(`品类 "${name}" 已存在`);
      }
      throw error;
    }
  }

  async update(id: string, data: { name?: string; defaultGrade?: string; sortOrder?: number }) {
    const values: Record<string, unknown> = {};
    if (data.name !== undefined) {
      const name = data.name.trim();
      if (!name) throw new BadRequestException('品类名称不能为空');
      values.name = name;
    }
    if (data.defaultGrade !== undefined) {
      values.defaultGrade = data.defaultGrade;
    }
    if (data.sortOrder !== undefined) {
      values.sortOrder = data.sortOrder;
    }
    if (Object.keys(values).length === 0) {
      throw new BadRequestException('没有需要更新的字段');
    }
    try {
      const result = await this.db
        .update(productCategory)
        .set(values)
        .where(eq(productCategory.id, id))
        .returning({ id: productCategory.id });
      if (result.length === 0) {
        throw new NotFoundException(`品类 ${id} 不存在`);
      }
      return { success: true };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      if (
        error instanceof Error &&
        error.message.includes('duplicate key')
      ) {
        throw new ConflictException(`品类名称 "${data.name}" 已存在`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    const cat = await this.db
      .select({ name: productCategory.name })
      .from(productCategory)
      .where(eq(productCategory.id, id))
      .limit(1);
    if (cat.length === 0) {
      throw new NotFoundException(`品类 ${id} 不存在`);
    }
    const categoryName = cat[0].name;

    const [productCount, marginCount, gradeCount] = await Promise.all([
      this.db
        .select({ count: product.id })
        .from(product)
        .where(eq(product.category, categoryName)),
      this.db
        .select({ count: productGradeMargin.id })
        .from(productGradeMargin)
        .where(eq(productGradeMargin.category, categoryName)),
      this.db
        .select({ count: customerCategoryGrade.id })
        .from(customerCategoryGrade)
        .where(eq(customerCategoryGrade.category, categoryName)),
    ]);

    if (productCount.length > 0 || marginCount.length > 0 || gradeCount.length > 0) {
      throw new ConflictException(
        `该品类已被使用（产品:${productCount.length} / 毛利率目标:${marginCount.length} / 客户等级:${gradeCount.length}），无法删除`,
      );
    }

    const result = await this.db
      .delete(productCategory)
      .where(eq(productCategory.id, id))
      .returning({ id: productCategory.id });
    if (result.length === 0) {
      throw new NotFoundException(`品类 ${id} 不存在`);
    }
    return { success: true };
  }
}

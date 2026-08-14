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
import {
  productGradeMargin,
} from '@server/database/schema';
import { eq, and, count, desc, or, like } from 'drizzle-orm';
import type { ImportProductGradeMarginError } from '@shared/product-grade-margin';

@Injectable()
export class ProductGradeMarginService {
  private readonly logger = new Logger(
    ProductGradeMarginService.name,
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
        or(
          like(
            productGradeMargin.category,
            `%${keyword}%`,
          ),
          like(
            productGradeMargin.productGrade,
            `%${keyword}%`,
          ),
        ),
      );
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const totalResult = await this.db
      .select({ count: count() })
      .from(productGradeMargin)
      .where(whereClause);

    const total = Number(totalResult[0]?.count ?? 0);
    const offset = (page - 1) * pageSize;

    const items = await this.db
      .select({
        id: productGradeMargin.id,
        category: productGradeMargin.category,
        productGrade: productGradeMargin.productGrade,
        targetMargin: productGradeMargin.targetMargin,
        marginRedline: productGradeMargin.marginRedline,
        salesRatio: productGradeMargin.salesRatio,
        marginContribution:
          productGradeMargin.marginContribution,
        createdAt: productGradeMargin.createdAt,
        updatedAt: productGradeMargin.updatedAt,
      })
      .from(productGradeMargin)
      .where(whereClause)
      .orderBy(desc(productGradeMargin.createdAt))
      .limit(pageSize)
      .offset(offset);

    return { items, total };
  }

  async create(data: {
    category: string;
    productGrade: string;
    targetMargin: string;
    marginRedline: string;
    salesRatio: string;
    marginContribution: string;
  }) {
    // Service-level uniqueness check (category + productGrade)
    const existing = await this.db
      .select({ id: productGradeMargin.id })
      .from(productGradeMargin)
      .where(
        and(
          eq(productGradeMargin.category, data.category),
          eq(productGradeMargin.productGrade, data.productGrade),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(
        '该品类与产品等级的组合已存在',
      );
    }

    const result = await this.db
      .insert(productGradeMargin)
      .values({
        category: data.category,
        productGrade: data.productGrade,
        customerLevelId: '',
        targetMargin: data.targetMargin,
        marginRedline: data.marginRedline,
        salesRatio: data.salesRatio,
        marginContribution: data.marginContribution,
      })
      .returning({ id: productGradeMargin.id });

    return { id: result[0].id };
  }

  async update(
    id: string,
    data: {
      category: string;
      productGrade: string;
      targetMargin: string;
      marginRedline: string;
      salesRatio: string;
      marginContribution: string;
    },
  ) {
    // Service-level uniqueness check (category + productGrade), excluding self
    const duplicate = await this.db
      .select({ id: productGradeMargin.id })
      .from(productGradeMargin)
      .where(
        and(
          eq(productGradeMargin.category, data.category),
          eq(productGradeMargin.productGrade, data.productGrade),
        ),
      )
      .limit(1);

    if (duplicate.length > 0 && duplicate[0].id !== id) {
      throw new ConflictException(
        '该品类与产品等级的组合已存在',
      );
    }

    const result = await this.db
      .update(productGradeMargin)
      .set({
        category: data.category,
        productGrade: data.productGrade,
        targetMargin: data.targetMargin,
        marginRedline: data.marginRedline,
        salesRatio: data.salesRatio,
        marginContribution: data.marginContribution,
      })
      .where(eq(productGradeMargin.id, id))
      .returning({ id: productGradeMargin.id });

    if (result.length === 0) {
      throw new NotFoundException(`记录 ${id} 不存在`);
    }

    return { success: true };
  }

  async remove(id: string) {
    const result = await this.db
      .delete(productGradeMargin)
      .where(eq(productGradeMargin.id, id))
      .returning({ id: productGradeMargin.id });

    if (result.length === 0) {
      throw new NotFoundException(`记录 ${id} 不存在`);
    }

    return { success: true };
  }

  async importItems(
    items: Array<{
      category: string;
      productGrade: string;
      targetMargin: string;
      marginRedline: string;
      salesRatio: string;
      marginContribution: string;
    }>,
  ) {
    const errors: ImportProductGradeMarginError[] = [];
    const validItems: Array<{
      category: string;
      productGrade: string;
      targetMargin: string;
      marginRedline: string;
      salesRatio: string;
      marginContribution: string;
    }> = [];

    for (let i = 0; i < items.length; i++) {
      const row = i + 2;
      const item = items[i];
      const rowErrors: string[] = [];

      if (!item.category || !item.category.trim()) {
        rowErrors.push('品类不能为空');
      }

      if (
        !item.productGrade ||
        !item.productGrade.trim()
      ) {
        rowErrors.push('产品等级不能为空');
      }

      const targetMargin = parseFloat(item.targetMargin);
      if (isNaN(targetMargin)) {
        rowErrors.push('请输入有效的目标毛利率');
      }

      const marginRedline =
        item.marginRedline?.trim()
          ? parseFloat(item.marginRedline)
          : 0;
      if (isNaN(marginRedline)) {
        rowErrors.push('请输入有效的毛利率红线');
      }

      const salesRatio =
        item.salesRatio?.trim()
          ? parseFloat(item.salesRatio)
          : 0;
      if (isNaN(salesRatio)) {
        rowErrors.push('请输入有效的销售占比');
      }

      const marginContribution =
        item.marginContribution?.trim()
          ? parseFloat(item.marginContribution)
          : 0;
      if (isNaN(marginContribution)) {
        rowErrors.push('请输入有效的毛利贡献率');
      }

      if (rowErrors.length > 0) {
        errors.push({ row, message: rowErrors.join('；') });
        continue;
      }

      validItems.push({
        category: item.category.trim(),
        productGrade: item.productGrade.trim(),
        targetMargin: String(targetMargin),
        marginRedline: String(marginRedline),
        salesRatio: String(salesRatio),
        marginContribution: String(marginContribution),
      });
    }

    if (validItems.length === 0) {
      return {
        success: false,
        imported: 0,
        updated: 0,
        failed: errors.length,
        errors,
      };
    }

    // Load existing records for upsert by category + productGrade
    const existing = await this.db
      .select({
        id: productGradeMargin.id,
        category: productGradeMargin.category,
        productGrade: productGradeMargin.productGrade,
      })
      .from(productGradeMargin);

    const existingMap = new Map<string, string>();
    for (const row of existing) {
      existingMap.set(
        `${row.category}|${row.productGrade}`,
        row.id,
      );
    }

    let imported = 0;
    let updated = 0;

    for (const item of validItems) {
      const key = `${item.category}|${item.productGrade}`;
      const existingId = existingMap.get(key);

      try {
        if (existingId) {
          await this.db
            .update(productGradeMargin)
            .set({
              targetMargin: item.targetMargin,
              marginRedline: item.marginRedline,
              salesRatio: item.salesRatio,
              marginContribution: item.marginContribution,
            })
            .where(eq(productGradeMargin.id, existingId));
          updated++;
        } else {
          await this.db.insert(productGradeMargin).values({
            category: item.category,
            productGrade: item.productGrade,
            customerLevelId: '',
            targetMargin: item.targetMargin,
            marginRedline: item.marginRedline,
            salesRatio: item.salesRatio,
            marginContribution: item.marginContribution,
          });
          imported++;
        }
      } catch (error: unknown) {
        const row =
          items.findIndex(
            (it) =>
              it.category?.trim() === item.category &&
              it.productGrade?.trim() ===
                item.productGrade,
          ) + 2;
        this.logger.error(
          `Import row ${row} failed: ${JSON.stringify(error)}`,
        );
        errors.push({
          row,
          message: `写入失败: ${item.category} + ${item.productGrade}`,
        });
      }
    }

    return {
      success: errors.length === 0,
      imported,
      updated,
      failed: errors.length,
      errors,
    };
  }
}

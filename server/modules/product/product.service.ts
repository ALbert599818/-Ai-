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
import { product } from '@server/database/schema';
import { eq, and, count, desc, or, ilike, inArray, like } from 'drizzle-orm';
import type {
  ImportProductError,
  ProductImportRow,
} from '@shared/product';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

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
          ilike(product.model, `%${keyword}%`),
          ilike(product.color, `%${keyword}%`),
        ),
      );
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const totalResult = await this.db
      .select({ count: count() })
      .from(product)
      .where(whereClause);

    const total = Number(totalResult[0]?.count ?? 0);
    const offset = (page - 1) * pageSize;

    const items = await this.db
      .select({
        id: product.id,
        code: product.code,
        model: product.model,
        series: product.series,
        erpCategory: product.erpCategory,
        category: product.category,
        color: product.color,
        productGrade: product.productGrade,
        purchasePrice: product.purchasePrice,
        purchaseCost: product.purchaseCost,
        rdCost: product.rdCost,
        moq: product.moq,
        isNewProduct: product.isNewProduct,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      })
      .from(product)
      .where(whereClause)
      .orderBy(desc(product.createdAt))
      .limit(pageSize)
      .offset(offset);

    return { items, total };
  }

  async generateProductCode(): Promise<string> {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const prefix = `P${dateStr}`;
    const result = await this.db
      .select({ count: count() })
      .from(product)
      .where(like(product.code, `${prefix}%`));
    const seq = (Number(result[0]?.count ?? 0)) + 1;
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  async create(data: {
    model: string;
    color: string;
    purchasePrice: string;
    moq: number;
    code?: string;
  }) {
    try {
      const code = data.code
        || await this.generateProductCode();

      const result = await this.db
        .insert(product)
        .values({
          model: data.model,
          color: data.color,
          purchasePrice: data.purchasePrice,
          moq: data.moq,
          category: '',
          productGrade: '',
          code,
        })
        .returning({ id: product.id });

      return { id: result[0].id };
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message.includes('duplicate key')
      ) {
        this.logger.warn(
          `Duplicate product: ${data.model} + ${data.color}`,
        );
        throw new ConflictException(
          `型号 "${data.model}" + 颜色 "${data.color}" 的组合已存在`,
        );
      }
      throw error;
    }
  }

  async update(
    id: string,
    data: {
      model: string;
      color: string;
      purchasePrice: string;
      moq: number;
    },
  ) {
    try {
      const result = await this.db
        .update(product)
        .set({
          model: data.model,
          color: data.color,
          purchasePrice: data.purchasePrice,
          moq: data.moq,
        })
        .where(eq(product.id, id))
        .returning({ id: product.id });

      if (result.length === 0) {
        throw new NotFoundException(`商品 ${id} 不存在`);
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
          `Duplicate product: ${data.model} + ${data.color}`,
        );
        throw new ConflictException(
          `型号 "${data.model}" + 颜色 "${data.color}" 的组合已存在`,
        );
      }
      throw error;
    }
  }

  async remove(id: string) {
    const result = await this.db
      .delete(product)
      .where(eq(product.id, id))
      .returning({ id: product.id });

    if (result.length === 0) {
      throw new NotFoundException(`商品 ${id} 不存在`);
    }

    return { success: true };
  }

  async importProducts(items: ProductImportRow[]) {
    const errors: ImportProductError[] = [];

    // Parsed valid items (internal representation)
    type ValidItem = {
      code: string;
      model: string;
      series: string;
      erpCategory: string;
      category: string;
      color: string;
      productGrade: string;
      purchaseCostValue: string;
      rdCost: string;
      moq: number;
      isNewProduct: boolean;
      rowIndex: number;
    };

    const validItems: ValidItem[] = [];

    // ---- Step 1: Validate each row ----
    for (let i = 0; i < items.length; i++) {
      const excelRow = i + 2;
      const item = items[i];
      const rowErrors: string[] = [];

      // 型号必填
      const model = (item.model || '').trim();
      if (!model) {
        rowErrors.push('产品型号不能为空');
      } else if (model.length > 100) {
        rowErrors.push('产品型号长度不能超过100');
      }

      // 颜色必填
      const color = (item.color || '').trim();
      if (!color) {
        rowErrors.push('商品颜色不能为空');
      } else if (color.length > 100) {
        rowErrors.push('商品颜色长度不能超过100');
      }

      // 采购成本正数
      const costStr = (item.purchaseCost || '').trim();
      const purchaseCostNum = parseFloat(costStr);
      if (!costStr || isNaN(purchaseCostNum) || purchaseCostNum <= 0) {
        rowErrors.push('产品物料采购成本必须为正数');
      }

      // MOQ 正整数
      const moq = Number(item.moq);
      if (!Number.isInteger(moq) || moq <= 0) {
        rowErrors.push('MOQ 必须为正整数');
      }

      // 研发成本非负（允许空，默认 0）
      const rdStr = (item.rdCost || '').trim();
      let rdCost = '0';
      if (rdStr !== '') {
        const rd = parseFloat(rdStr);
        if (isNaN(rd) || rd < 0) {
          rowErrors.push('研发费用成本必须为非负数');
        } else {
          rdCost = String(rd);
        }
      }

      // 等级允许 S/A/B/无
      const grade = (item.productGrade || '').trim() || '无';
      const allowedGrades = ['S', 'A', 'B', '无'];
      if (!allowedGrades.includes(grade)) {
        rowErrors.push(
          `产品级别必须为 S/A/B/无，当前值: "${grade}"`,
        );
      }

      if (rowErrors.length > 0) {
        errors.push({ row: excelRow, message: rowErrors.join('；') });
        continue;
      }

      // 新品/老品
      const newProductStr = (item.isNewProduct || '').trim();
      const isNewProduct = newProductStr !== '老品';

      validItems.push({
        code: (item.code || '').trim(),
        model,
        series: (item.series || '').trim(),
        erpCategory: (item.erpCategory || '').trim(),
        category: (item.category || '').trim(),
        color,
        productGrade: grade,
        purchaseCostValue: String(purchaseCostNum),
        rdCost,
        moq,
        isNewProduct,
        rowIndex: i,
      });
    }

    // ---- Step 2: Dedup within import (model+color, last wins) ----
    const mcDedupMap = new Map<string, ValidItem>();
    for (const item of validItems) {
      const key = `${item.model}|${item.color}`;
      mcDedupMap.set(key, item);
    }
    const dedupedItems = Array.from(mcDedupMap.values());

    // Dedup by non-empty code within import (last wins)
    const codeDedupMap = new Map<string, ValidItem>();
    for (const item of dedupedItems) {
      if (item.code) {
        codeDedupMap.set(item.code, item);
      }
    }
    const finalItems = Array.from(codeDedupMap.values());
    // Keep items without code too
    for (const item of dedupedItems) {
      if (!item.code) {
        finalItems.push(item);
      }
    }

    if (finalItems.length === 0) {
      return {
        success: errors.length === 0,
        imported: 0,
        failed: errors.length,
        errors,
      };
    }

    // ---- Step 3: Check against DB ----
    const models = [...new Set(finalItems.map((it) => it.model))];
    const colors = [...new Set(finalItems.map((it) => it.color))];
    const codes = finalItems
      .filter((it) => it.code)
      .map((it) => it.code);

    const [existingProducts, existingCodeRows] = await Promise.all([
      this.db
        .select({
          id: product.id,
          model: product.model,
          color: product.color,
        })
        .from(product)
        .where(
          and(
            inArray(product.model, models),
            inArray(product.color, colors),
          ),
        ),
      codes.length > 0
        ? this.db
            .select({
              id: product.id,
              code: product.code,
            })
            .from(product)
            .where(inArray(product.code, codes))
        : Promise.resolve([]),
    ]);

    const existingMCMap = new Map<string, string>();
    for (const p of existingProducts) {
      existingMCMap.set(`${p.model}|${p.color}`, p.id);
    }

    const existingCodeMap = new Map<string, string>();
    for (const r of existingCodeRows) {
      if (r.code) existingCodeMap.set(r.code, r.id);
    }

    // Split into updates vs inserts, check code conflicts
    const toUpdate: Array<{
      id: string;
      item: ValidItem;
    }> = [];
    const toInsert: Array<ValidItem> = [];

    for (const item of finalItems) {
      const key = `${item.model}|${item.color}`;
      const excelRow = item.rowIndex + 2;

      // Code conflict: code exists in DB but belongs to different product
      if (item.code && existingCodeMap.has(item.code)) {
        const codeOwnerId = existingCodeMap.get(item.code)!;
        const existingId = existingMCMap.get(key);
        // If this (model, color) doesn't exist yet, or the code belongs
        // to a different product, it's a conflict
        if (!existingId || existingId !== codeOwnerId) {
          errors.push({
            row: excelRow,
            message: `编码 "${item.code}" 已被其他产品使用`,
          });
          continue;
        }
      }

      if (existingMCMap.has(key)) {
        toUpdate.push({
          id: existingMCMap.get(key)!,
          item,
        });
      } else {
        toInsert.push(item);
      }
    }

    // ---- Step 4: Execute DB operations ----
    // 为无编码的新产品自动生成编码
    for (const item of toInsert) {
      if (!item.code) {
        item.code = await this.generateProductCode();
      }
    }

    const buildValues = (item: ValidItem) => ({
      model: item.model,
      color: item.color,
      code: item.code || null,
      series: item.series || null,
      erpCategory: item.erpCategory || null,
      category: item.category,
      productGrade: item.productGrade,
      purchasePrice: item.purchaseCostValue,
      purchaseCost: item.purchaseCostValue,
      rdCost: item.rdCost,
      moq: item.moq,
      isNewProduct: item.isNewProduct,
    });

    // Batch update existing products
    if (toUpdate.length > 0) {
      try {
        for (const { id, item } of toUpdate) {
          await this.db
            .update(product)
            .set(buildValues(item))
            .where(eq(product.id, id));
        }
      } catch (error: unknown) {
        this.logger.error(
          `Batch update failed: ${JSON.stringify(error)}`,
        );
        throw new BadRequestException('批量更新失败，请重试');
      }
    }

    // Batch insert new products
    if (toInsert.length > 0) {
      try {
        await this.db
          .insert(product)
          .values(toInsert.map(buildValues));
      } catch (error: unknown) {
        this.logger.error(
          `Batch insert failed: ${JSON.stringify(error)}`,
        );
        throw new BadRequestException('批量导入失败，请重试');
      }
    }

    return {
      success: errors.length === 0,
      imported: toInsert.length + toUpdate.length,
      failed: errors.length,
      errors,
    };
  }

  async getCategories() {
    const rows = await this.db
      .select({ category: product.category })
      .from(product)
      .where(and(eq(product.category, product.category)))
      .groupBy(product.category)
      .orderBy(product.category);
    return rows
      .map((r) => r.category)
      .filter((c): c is string => !!c && c.trim() !== '');
  }

  async batchUpdateGrade(category: string, productGrade: string) {
    if (!category || !category.trim()) {
      throw new BadRequestException('品类不能为空');
    }
    const allowedGrades = ['S', 'A', 'B', 'C', 'D', '无'];
    if (!allowedGrades.includes(productGrade)) {
      throw new BadRequestException(
        `产品等级必须为 ${allowedGrades.join('/')}`,
      );
    }
    const result = await this.db
      .update(product)
      .set({ productGrade })
      .where(eq(product.category, category))
      .returning({ id: product.id });
    return { updated: result.length };
  }
}

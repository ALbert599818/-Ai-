import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@server/lib/platform';
import { purchaseQuantity } from '@server/database/schema';
import { eq, count, desc } from 'drizzle-orm';
import type {
  PurchaseQuantityListParams,
  PurchaseQuantityListResponse,
  CreatePurchaseQuantityRequest,
  UpdatePurchaseQuantityRequest,
  ImportPurchaseQuantityResponse,
} from '@shared/purchase-quantity';

@Injectable()
export class PurchaseQuantityService {
  private readonly logger = new Logger(PurchaseQuantityService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE)
    private readonly db: PostgresJsDatabase,
  ) {}

  async findAll(
    params: PurchaseQuantityListParams,
  ): Promise<PurchaseQuantityListResponse> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const offset = (page - 1) * pageSize;

    const [items, totalResult] = await Promise.all([
      this.db
        .select()
        .from(purchaseQuantity)
        .orderBy(desc(purchaseQuantity.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ count: count() })
        .from(purchaseQuantity),
    ]);

    const total = Number(totalResult[0]?.count ?? 0);

    return {
      items: items.map((item) => ({
        id: item.id,
        typeDesc: item.typeDesc,
        discount: Number(item.discount),
        minMultiple: Number(item.minMultiple),
        maxMultiple: Number(item.maxMultiple),
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      total,
    };
  }

  async create(data: CreatePurchaseQuantityRequest) {
    const result = await this.db
      .insert(purchaseQuantity)
      .values({
        typeDesc: data.typeDesc,
        discount: String(data.discount),
        minMultiple: String(data.minMultiple ?? 0),
        maxMultiple: String(data.maxMultiple ?? 0),
      })
      .returning({ id: purchaseQuantity.id });

    return { id: result[0].id };
  }

  async update(id: string, data: UpdatePurchaseQuantityRequest) {
    const updated = await this.db
      .update(purchaseQuantity)
      .set({
        typeDesc: data.typeDesc,
        discount: String(data.discount),
        minMultiple: String(data.minMultiple ?? 0),
        maxMultiple: String(data.maxMultiple ?? 0),
        updatedAt: new Date(),
      })
      .where(eq(purchaseQuantity.id, id))
      .returning({ id: purchaseQuantity.id });

    if (updated.length === 0) {
      throw new NotFoundException(
        `Purchase quantity record with id ${id} not found`,
      );
    }

    return { success: true };
  }

  async remove(id: string) {
    const deleted = await this.db
      .delete(purchaseQuantity)
      .where(eq(purchaseQuantity.id, id))
      .returning({ id: purchaseQuantity.id });

    if (deleted.length === 0) {
      throw new NotFoundException(
        `Purchase quantity record with id ${id} not found`,
      );
    }

    return { success: true };
  }

  async importItems(
    rows: Array<{
      typeDesc: string;
      discount: string;
      minMultiple?: string;
      maxMultiple?: string;
    }>,
  ): Promise<ImportPurchaseQuantityResponse> {
    let imported = 0;
    let updated = 0;
    let failed = 0;
    const errors: Array<{ row: number; message: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel 行号（第 1 行是表头）

      try {
        const typeDesc = String(row.typeDesc ?? '').trim();
        if (!typeDesc) {
          errors.push({ row: rowNum, message: '类型描述不能为空' });
          failed++;
          continue;
        }

        const discountValue = Number(row.discount);
        if (isNaN(discountValue)) {
          errors.push({ row: rowNum, message: '折扣值格式错误' });
          failed++;
          continue;
        }

        const minMultiple = row.minMultiple != null && row.minMultiple !== ''
          ? Number(row.minMultiple)
          : 0;
        const maxMultiple = row.maxMultiple != null && row.maxMultiple !== ''
          ? Number(row.maxMultiple)
          : 0;

        if (row.minMultiple != null && row.minMultiple !== '' && isNaN(minMultiple)) {
          errors.push({ row: rowNum, message: '最小倍数格式错误' });
          failed++;
          continue;
        }
        if (row.maxMultiple != null && row.maxMultiple !== '' && isNaN(maxMultiple)) {
          errors.push({ row: rowNum, message: '最大倍数格式错误' });
          failed++;
          continue;
        }

        // 查找是否已存在相同 typeDesc
        const existing = await this.db
          .select({ id: purchaseQuantity.id })
          .from(purchaseQuantity)
          .where(eq(purchaseQuantity.typeDesc, typeDesc))
          .limit(1);

        if (existing.length > 0) {
          // 更新已有记录
          await this.db
            .update(purchaseQuantity)
            .set({
              discount: String(discountValue),
              minMultiple: String(minMultiple),
              maxMultiple: String(maxMultiple),
              updatedAt: new Date(),
            })
            .where(eq(purchaseQuantity.id, existing[0].id));
          updated++;
        } else {
          // 新增记录
          await this.db.insert(purchaseQuantity).values({
            typeDesc,
            discount: String(discountValue),
            minMultiple: String(minMultiple),
            maxMultiple: String(maxMultiple),
          });
          imported++;
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        errors.push({ row: rowNum, message: msg });
        failed++;
      }
    }

    this.logger.log(
      `拿货量导入完成: 新增${imported}, 更新${updated}, 失败${failed}`,
    );
    return {
      success: failed === 0,
      imported,
      updated,
      failed,
      errors,
    };
  }
}

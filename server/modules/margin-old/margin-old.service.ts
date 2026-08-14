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
import { grossMarginTargetOld } from '@server/database/schema';
import { eq, and, or, count, desc, like } from 'drizzle-orm';

@Injectable()
export class MarginOldService {
  private readonly logger = new Logger(MarginOldService.name);

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
            grossMarginTargetOld.customerShortName,
            `%${keyword}%`,
          ),
          like(grossMarginTargetOld.model, `%${keyword}%`),
        ),
      );
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const totalResult = await this.db
      .select({ count: count() })
      .from(grossMarginTargetOld)
      .where(whereClause);

    const total = Number(totalResult[0]?.count ?? 0);

    const offset = (page - 1) * pageSize;

    const items = await this.db
      .select({
        id: grossMarginTargetOld.id,
        customerShortName: grossMarginTargetOld.customerShortName,
        model: grossMarginTargetOld.model,
        targetMargin: grossMarginTargetOld.targetMargin,
        createdAt: grossMarginTargetOld.createdAt,
        updatedAt: grossMarginTargetOld.updatedAt,
      })
      .from(grossMarginTargetOld)
      .where(whereClause)
      .orderBy(desc(grossMarginTargetOld.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      items: items.map((item) => ({
        ...item,
        targetMargin: Number(item.targetMargin),
      })),
      total,
    };
  }

  async create(data: {
    customerShortName: string;
    model: string;
    targetMargin: number;
  }) {
    try {
      const result = await this.db
        .insert(grossMarginTargetOld)
        .values({
          customerShortName: data.customerShortName,
          model: data.model,
          targetMargin: String(data.targetMargin),
        })
        .returning({ id: grossMarginTargetOld.id });

      return { id: result[0].id };
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message.includes('duplicate key')
      ) {
        this.logger.warn(
          `Duplicate margin old entry: ${data.customerShortName} + ${data.model}`,
        );
        throw new ConflictException(
          `客户「${data.customerShortName}」的产品型号「${data.model}」已存在`,
        );
      }
      throw error;
    }
  }

  async update(
    id: string,
    data: {
      customerShortName: string;
      model: string;
      targetMargin: number;
    },
  ) {
    try {
      const result = await this.db
        .update(grossMarginTargetOld)
        .set({
          customerShortName: data.customerShortName,
          model: data.model,
          targetMargin: String(data.targetMargin),
        })
        .where(eq(grossMarginTargetOld.id, id))
        .returning({ id: grossMarginTargetOld.id });

      if (result.length === 0) {
        throw new NotFoundException(
          `老品毛利率目标 ${id} 不存在`,
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
          `Duplicate margin old entry: ${data.customerShortName} + ${data.model}`,
        );
        throw new ConflictException(
          `客户「${data.customerShortName}」的产品型号「${data.model}」已存在`,
        );
      }
      throw error;
    }
  }

  async remove(id: string) {
    const result = await this.db
      .delete(grossMarginTargetOld)
      .where(eq(grossMarginTargetOld.id, id))
      .returning({ id: grossMarginTargetOld.id });

    if (result.length === 0) {
      throw new NotFoundException(
        `老品毛利率目标 ${id} 不存在`,
      );
    }

    return { success: true };
  }

  async importData(
    items: Array<{
      customerShortName: string;
      model: string;
      targetMargin: string;
    }>,
  ) {
    let imported = 0;
    let updated = 0;
    let failed = 0;
    const errors: Array<{ row: number; message: string }> = [];

    for (let i = 0; i < items.length; i++) {
      const row = i + 2;
      const item = items[i];
      const customerShortName = (item.customerShortName ?? '').trim();
      const model = (item.model ?? '').trim();
      const rawMargin = (item.targetMargin ?? '').trim();

      if (!customerShortName) {
        errors.push({ row, message: '客户简称不能为空' });
        failed++;
        continue;
      }
      if (!model) {
        errors.push({ row, message: '产品型号不能为空' });
        failed++;
        continue;
      }
      if (!rawMargin) {
        errors.push({ row, message: '目标毛利率不能为空' });
        failed++;
        continue;
      }

      let targetMargin: number;
      const percentMatch = rawMargin.match(/^([\d.]+)%$/);
      if (percentMatch) {
        targetMargin = parseFloat(percentMatch[1]) / 100;
      } else {
        targetMargin = parseFloat(rawMargin);
      }

      if (isNaN(targetMargin) || targetMargin < 0 || targetMargin > 1) {
        errors.push({
          row,
          message: `目标毛利率格式错误: ${rawMargin}，请输入 0-1 之间的小数或百分比`,
        });
        failed++;
        continue;
      }

      try {
        const existing = await this.db
          .select({ id: grossMarginTargetOld.id })
          .from(grossMarginTargetOld)
          .where(
            and(
              eq(grossMarginTargetOld.customerShortName, customerShortName),
              eq(grossMarginTargetOld.model, model),
            ),
          )
          .limit(1);

        if (existing.length > 0) {
          await this.db
            .update(grossMarginTargetOld)
            .set({ targetMargin: String(targetMargin) })
            .where(eq(grossMarginTargetOld.id, existing[0].id));
          updated++;
        } else {
          await this.db
            .insert(grossMarginTargetOld)
            .values({
              customerShortName,
              model,
              targetMargin: String(targetMargin),
            });
          imported++;
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : '未知错误';
        errors.push({ row, message: msg });
        failed++;
      }
    }

    this.logger.log(
      `老品毛利率导入完成: 新增${imported}, 更新${updated}, 失败${failed}`,
    );

    return { imported, updated, failed, errors };
  }
}

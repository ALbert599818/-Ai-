import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/lib/platform';
import { eq, and, count } from 'drizzle-orm';
import { priceSensitivity } from '@server/database/schema';
import type {
  ImportPriceSensitivityError,
  ImportPriceSensitivityResponse,
} from '@shared/price-sensitivity';

@Injectable()
export class PriceSensitivityService {
  private readonly logger = new Logger(PriceSensitivityService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async findAll(params: { region?: string; page?: number; pageSize?: number }) {
    const { region, page = 1, pageSize = 20 } = params;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (region) {
      conditions.push(eq(priceSensitivity.region, region));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      this.db
        .select({
          id: priceSensitivity.id,
          region: priceSensitivity.region,
          channelType: priceSensitivity.channelType,
          discount: priceSensitivity.discount,
          createdAt: priceSensitivity.createdAt,
          updatedAt: priceSensitivity.updatedAt,
        })
        .from(priceSensitivity)
        .where(whereClause)
        .orderBy(priceSensitivity.region, priceSensitivity.channelType)
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ count: count() })
        .from(priceSensitivity)
        .where(whereClause),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        discount: Number(item.discount),
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      total: Number(totalResult[0].count),
    };
  }

  async create(data: { region: string; channelType: string; discount: number }) {
    try {
      const result = await this.db
        .insert(priceSensitivity)
        .values({
          region: data.region,
          channelType: data.channelType,
          discount: String(data.discount),
          mode: '',
        })
        .returning({ id: priceSensitivity.id });

      return { id: result[0].id };
    } catch (error: unknown) {
      const pgError = error as { code?: string };
      if (pgError.code === '23505') {
        throw new ConflictException('该区域+渠道类型组合已存在');
      }
      this.logger.error(`Create failed: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async update(
    id: string,
    data: { region: string; channelType: string; discount: number },
  ) {
    try {
      const result = await this.db
        .update(priceSensitivity)
        .set({
          region: data.region,
          channelType: data.channelType,
          discount: String(data.discount),
          mode: '',
        })
        .where(eq(priceSensitivity.id, id))
        .returning({ id: priceSensitivity.id });

      if (result.length === 0) {
        throw new NotFoundException('记录不存在');
      }

      return { success: true };
    } catch (error: unknown) {
      const pgError = error as { code?: string };
      if (pgError.code === '23505') {
        throw new ConflictException('该区域+渠道类型组合已存在');
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Update failed: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async remove(id: string) {
    const result = await this.db
      .delete(priceSensitivity)
      .where(eq(priceSensitivity.id, id))
      .returning({ id: priceSensitivity.id });

    if (result.length === 0) {
      throw new NotFoundException('记录不存在');
    }

    return { success: true };
  }

  async importItems(
    items: Array<{ region: string; channelType: string; discount: string }>,
  ): Promise<ImportPriceSensitivityResponse> {
    const errors: ImportPriceSensitivityError[] = [];
    const validItems: Array<{ region: string; channelType: string; discount: string }> = [];

    for (let i = 0; i < items.length; i++) {
      const row = i + 2;
      const item = items[i];
      const rowErrors: string[] = [];

      if (!item.region || !item.region.trim()) {
        rowErrors.push('区域不能为空');
      }

      if (!item.channelType || !item.channelType.trim()) {
        rowErrors.push('渠道类型不能为空');
      }

      const discount = parseFloat(item.discount);
      if (isNaN(discount)) {
        rowErrors.push('折扣必须是有效数字');
      }

      if (rowErrors.length > 0) {
        errors.push({ row, message: rowErrors.join('；') });
        continue;
      }

      validItems.push({
        region: item.region.trim(),
        channelType: item.channelType.trim(),
        discount: String(discount),
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

    // Fetch existing records to check for duplicates
    const existing = await this.db
      .select({
        id: priceSensitivity.id,
        region: priceSensitivity.region,
        channelType: priceSensitivity.channelType,
      })
      .from(priceSensitivity);

    const existingMap = new Map<string, string>();
    for (const row of existing) {
      existingMap.set(
        `${row.region}|${row.channelType}`,
        row.id,
      );
    }

    let imported = 0;
    let updated = 0;

    for (const item of validItems) {
      const key = `${item.region}|${item.channelType}`;
      const existingId = existingMap.get(key);

      try {
        if (existingId) {
          await this.db
            .update(priceSensitivity)
            .set({
              discount: item.discount,
            })
            .where(eq(priceSensitivity.id, existingId));
          updated++;
        } else {
          await this.db.insert(priceSensitivity).values({
            region: item.region,
            channelType: item.channelType,
            discount: item.discount,
            mode: '',
          });
          imported++;
        }
      } catch (error: unknown) {
        const row =
          items.findIndex(
            (it) =>
              it.region?.trim() === item.region &&
              it.channelType?.trim() === item.channelType,
          ) + 2;
        this.logger.error(
          `Import row ${row} failed: ${JSON.stringify(error)}`,
        );
        errors.push({
          row,
          message: `写入失败: ${item.region} + ${item.channelType}`,
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

import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/lib/platform';
import { eq, and, count, sql } from 'drizzle-orm';
import { insuranceCoefficient } from '@server/database/schema';

@Injectable()
export class InsuranceService {
  private readonly logger = new Logger(InsuranceService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async findAll(params: {
    keyword?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { keyword, page = 1, pageSize = 20 } = params;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (keyword) {
      conditions.push(sql`${insuranceCoefficient.creditCondition} ILIKE ${`%${keyword}%`}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      this.db
        .select({
          id: insuranceCoefficient.id,
          creditCondition: insuranceCoefficient.creditCondition,
          coefficient: insuranceCoefficient.coefficient,
          createdAt: insuranceCoefficient.createdAt,
          updatedAt: insuranceCoefficient.updatedAt,
        })
        .from(insuranceCoefficient)
        .where(whereClause)
        .orderBy(insuranceCoefficient.creditCondition)
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ count: count() })
        .from(insuranceCoefficient)
        .where(whereClause),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        coefficient: Number(item.coefficient),
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      total: Number(totalResult[0].count),
    };
  }

  async create(data: { creditCondition: string; coefficient: number }) {
    try {
      const result = await this.db
        .insert(insuranceCoefficient)
        .values({
          creditCondition: data.creditCondition,
          coefficient: String(data.coefficient),
        })
        .returning({ id: insuranceCoefficient.id });

      return { id: result[0].id };
    } catch (error: unknown) {
      const pgError = error as { code?: string };
      if (pgError.code === '23505') {
        throw new ConflictException('该信用条件已存在');
      }
      this.logger.error(`Create failed: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async update(
    id: string,
    data: { creditCondition: string; coefficient: number },
  ) {
    try {
      const result = await this.db
        .update(insuranceCoefficient)
        .set({
          creditCondition: data.creditCondition,
          coefficient: String(data.coefficient),
        })
        .where(eq(insuranceCoefficient.id, id))
        .returning({ id: insuranceCoefficient.id });

      if (result.length === 0) {
        throw new NotFoundException('记录不存在');
      }

      return { success: true };
    } catch (error: unknown) {
      const pgError = error as { code?: string };
      if (pgError.code === '23505') {
        throw new ConflictException('该信用条件已存在');
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Update failed: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async importItems(
    items: Array<{ creditCondition: string; coefficient: string }>,
  ) {
    const errors: Array<{ row: number; message: string }> = [];
    const validItems: Array<{ creditCondition: string; coefficient: string }> = [];

    for (let i = 0; i < items.length; i++) {
      const row = i + 2;
      const item = items[i];
      const rowErrors: string[] = [];

      if (!item.creditCondition || !item.creditCondition.trim()) {
        rowErrors.push('信用条件不能为空');
      }

      const coefficient = parseFloat(item.coefficient);
      if (isNaN(coefficient)) {
        rowErrors.push('请输入有效的系数值');
      }

      if (rowErrors.length > 0) {
        errors.push({ row, message: rowErrors.join('；') });
        continue;
      }

      validItems.push({
        creditCondition: item.creditCondition.trim(),
        coefficient: String(coefficient / 100),
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

    const existing = await this.db
      .select({
        id: insuranceCoefficient.id,
        creditCondition: insuranceCoefficient.creditCondition,
      })
      .from(insuranceCoefficient);

    const existingMap = new Map<string, string>();
    for (const row of existing) {
      existingMap.set(row.creditCondition, row.id);
    }

    let imported = 0;
    let updated = 0;

    for (const item of validItems) {
      const existingId = existingMap.get(item.creditCondition);
      try {
        if (existingId) {
          await this.db
            .update(insuranceCoefficient)
            .set({ coefficient: item.coefficient })
            .where(eq(insuranceCoefficient.id, existingId));
          updated++;
        } else {
          await this.db.insert(insuranceCoefficient).values({
            creditCondition: item.creditCondition,
            coefficient: item.coefficient,
          });
          imported++;
        }
      } catch (error: unknown) {
        const row = items.findIndex(
          (it) => it.creditCondition?.trim() === item.creditCondition,
        ) + 2;
        this.logger.error(
          `Import row ${row} failed: ${JSON.stringify(error)}`,
        );
        errors.push({ row, message: `写入失败: ${item.creditCondition}` });
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

  async remove(id: string) {
    const result = await this.db
      .delete(insuranceCoefficient)
      .where(eq(insuranceCoefficient.id, id))
      .returning({ id: insuranceCoefficient.id });

    if (result.length === 0) {
      throw new NotFoundException('记录不存在');
    }

    return { success: true };
  }
}

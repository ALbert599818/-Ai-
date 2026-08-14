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
import { customFeeConfig } from '@server/database/schema';
import { eq, and, count, desc, like, inArray } from 'drizzle-orm';

@Injectable()
export class CustomFeeConfigService {
  private readonly logger = new Logger(
    CustomFeeConfigService.name,
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
        like(customFeeConfig.name, `%${keyword}%`),
      );
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const totalResult = await this.db
      .select({ count: count() })
      .from(customFeeConfig)
      .where(whereClause);

    const total = Number(totalResult[0]?.count ?? 0);

    const offset = (page - 1) * pageSize;

    const items = await this.db
      .select({
        id: customFeeConfig.id,
        name: customFeeConfig.name,
        createdAt: customFeeConfig.createdAt,
        updatedAt: customFeeConfig.updatedAt,
      })
      .from(customFeeConfig)
      .where(whereClause)
      .orderBy(desc(customFeeConfig.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      items: items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      total,
    };
  }

  async create(data: { name: string }) {
    try {
      const result = await this.db
        .insert(customFeeConfig)
        .values({ name: data.name })
        .returning({ id: customFeeConfig.id });

      return { id: result[0].id };
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message.includes('duplicate key')
      ) {
        this.logger.warn(
          `Duplicate custom fee config name: ${data.name}`,
        );
        throw new ConflictException(
          `定制项名称 "${data.name}" 已存在`,
        );
      }
      throw error;
    }
  }

  async update(id: string, data: { name: string }) {
    try {
      const result = await this.db
        .update(customFeeConfig)
        .set({ name: data.name })
        .where(eq(customFeeConfig.id, id))
        .returning({ id: customFeeConfig.id });

      if (result.length === 0) {
        throw new NotFoundException(
          `定制项配置 ${id} 不存在`,
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
          `Duplicate custom fee config name: ${data.name}`,
        );
        throw new ConflictException(
          `定制项名称 "${data.name}" 已存在`,
        );
      }
      throw error;
    }
  }

  async importItems(items: Array<{ name: string }>) {
    let imported = 0;
    let skipped = 0;
    let failed = 0;
    const errors: Array<{ row: number; message: string }> = [];

    // Validate all items first
    const validItems: Array<{ row: number; name: string }> = [];
    for (let i = 0; i < items.length; i++) {
      const row = i + 2; // Excel row (1-indexed header + 1-indexed data)
      const name = (items[i]?.name ?? '').trim();

      if (!name) {
        failed++;
        errors.push({ row, message: '名称不能为空' });
        continue;
      }
      if (name.length > 200) {
        failed++;
        errors.push({ row, message: `名称超过200字符限制（当前${name.length}字符）` });
        continue;
      }
      validItems.push({ row, name });
    }

    // Deduplicate within the import batch
    const seenNames = new Set<string>();
    const uniqueItems: Array<{ row: number; name: string }> = [];
    for (const item of validItems) {
      const lowerName = item.name.toLowerCase();
      if (seenNames.has(lowerName)) {
        failed++;
        errors.push({ row: item.row, message: `与本次导入中的其他行重复：${item.name}` });
        continue;
      }
      seenNames.add(lowerName);
      uniqueItems.push(item);
    }

    // Query existing names in batch
    if (uniqueItems.length > 0) {
      const namesToCheck = uniqueItems.map((item: { row: number; name: string }) => item.name);
      const existing = await this.db
        .select({ name: customFeeConfig.name })
        .from(customFeeConfig)
        .where(inArray(customFeeConfig.name, namesToCheck));

      const existingSet = new Set(
        existing.map((e: { name: string }) => e.name),
      );

      // Insert non-existing items in batch
      const toInsert: Array<{ row: number; name: string }> = [];
      for (const item of uniqueItems) {
        if (existingSet.has(item.name)) {
          skipped++;
        } else {
          toInsert.push(item);
        }
      }

      if (toInsert.length > 0) {
        try {
          await this.db
            .insert(customFeeConfig)
            .values(toInsert.map((item: { row: number; name: string }) => ({ name: item.name })));
          imported = toInsert.length;
        } catch (error: unknown) {
          this.logger.error(
            `Batch import failed: ${error instanceof Error ? error.message : String(error)}`,
          );
          // Fallback to one-by-one insert
          for (const item of toInsert) {
            try {
              await this.db
                .insert(customFeeConfig)
                .values({ name: item.name });
              imported++;
            } catch (itemError: unknown) {
              failed++;
              const msg = itemError instanceof Error ? itemError.message : '未知错误';
              errors.push({ row: item.row, message: `插入失败：${msg}` });
            }
          }
        }
      }
    }

    return {
      success: failed === 0,
      imported,
      skipped,
      failed,
      errors,
    };
  }

  async remove(id: string) {
    const result = await this.db
      .delete(customFeeConfig)
      .where(eq(customFeeConfig.id, id))
      .returning({ id: customFeeConfig.id });

    if (result.length === 0) {
      throw new NotFoundException(
        `定制项配置 ${id} 不存在`,
      );
    }

    return { success: true };
  }
}

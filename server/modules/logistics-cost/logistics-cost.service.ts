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
import { logisticsCost } from '@server/database/schema';
import { eq, count, desc } from 'drizzle-orm';
import type {
  LogisticsCostListParams,
  LogisticsCostListResponse,
  CreateLogisticsCostRequest,
  UpdateLogisticsCostRequest,
} from '@shared/logistics-cost';

@Injectable()
export class LogisticsCostService {
  private readonly logger = new Logger(LogisticsCostService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE)
    private readonly db: PostgresJsDatabase,
  ) {}

  async findAll(
    params: LogisticsCostListParams,
  ): Promise<LogisticsCostListResponse> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const offset = (page - 1) * pageSize;

    const [items, totalResult] = await Promise.all([
      this.db
        .select()
        .from(logisticsCost)
        .orderBy(desc(logisticsCost.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ count: count() })
        .from(logisticsCost),
    ]);

    const total = Number(totalResult[0]?.count ?? 0);

    return {
      items: items.map((item) => ({
        id: item.id,
        costType: item.costType,
        discount: Number(item.discount),
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      total,
    };
  }

  async create(data: CreateLogisticsCostRequest) {
    const result = await this.db
      .insert(logisticsCost)
      .values({
        costType: data.costType,
        discount: String(data.discount),
      })
      .returning({ id: logisticsCost.id });

    return { id: result[0].id };
  }

  async update(id: string, data: UpdateLogisticsCostRequest) {
    const updated = await this.db
      .update(logisticsCost)
      .set({
        costType: data.costType,
        discount: String(data.discount),
        updatedAt: new Date(),
      })
      .where(eq(logisticsCost.id, id))
      .returning({ id: logisticsCost.id });

    if (updated.length === 0) {
      throw new NotFoundException(
        `Logistics cost record with id ${id} not found`,
      );
    }

    return { success: true };
  }

  async remove(id: string) {
    const deleted = await this.db
      .delete(logisticsCost)
      .where(eq(logisticsCost.id, id))
      .returning({ id: logisticsCost.id });

    if (deleted.length === 0) {
      throw new NotFoundException(
        `Logistics cost record with id ${id} not found`,
      );
    }

    return { success: true };
  }
}

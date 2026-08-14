import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@server/lib/platform';
import { quotation } from '@server/database/schema';
import { and, or, count, desc, like, eq, inArray, sql } from 'drizzle-orm';

@Injectable()
export class MyCenterService {
  private readonly logger = new Logger(MyCenterService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE)
    private readonly db: PostgresJsDatabase,
  ) {}

  async findByUser(
    userId: string,
    params: {
      status?: string;
      page?: number;
      pageSize?: number;
      keyword?: string;
    },
  ) {
    const { status, page = 1, pageSize = 20, keyword } = params;

    const conditions = [
      sql`(${quotation.createdBy}).user_id = ${userId}`,
    ];
    if (status) {
      conditions.push(eq(quotation.status, status));
    }
    if (keyword) {
      conditions.push(
        or(
          like(quotation.quotationNo, `%${keyword}%`),
          like(quotation.customerShortName, `%${keyword}%`),
        ),
      );
    }

    const whereClause = and(...conditions);
    const totalResult = await this.db
      .select({ count: count() })
      .from(quotation)
      .where(whereClause);
    const total = Number(totalResult[0]?.count ?? 0);

    const items = await this.db
      .select({
        id: quotation.id,
        quotationNo: quotation.quotationNo,
        customerShortName: quotation.customerShortName,
        customerFullName: quotation.customerFullName,
        totalAmount: quotation.totalAmount,
        status: quotation.status,
        createdByName: quotation.createdByName,
        createdAt: quotation.createdAt,
        updatedAt: quotation.updatedAt,
      })
      .from(quotation)
      .where(whereClause)
      .orderBy(desc(quotation.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return {
      items: items.map((item) => ({
        ...item,
        totalAmount: Number(item.totalAmount),
      })),
      total,
    };
  }

  async getMyPendingQuotations(userId: string) {
    const whereClause = and(
      sql`(${quotation.createdBy}).user_id = ${userId}`,
      inArray(quotation.status, ['draft', 'submitted']),
    );

    const [items, totalResult] = await Promise.all([
      this.db
        .select({
          id: quotation.id,
          quotationNo: quotation.quotationNo,
          customerShortName: quotation.customerShortName,
          totalAmount: quotation.totalAmount,
          status: quotation.status,
          createdAt: quotation.createdAt,
        })
        .from(quotation)
        .where(whereClause)
        .orderBy(desc(quotation.createdAt)),
      this.db
        .select({ count: count() })
        .from(quotation)
        .where(whereClause),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        totalAmount: Number(item.totalAmount),
        createdAt: item.createdAt.toISOString(),
      })),
      total: Number(totalResult[0]?.count ?? 0),
    };
  }

  async getMyCompletedQuotations(userId: string) {
    const whereClause = and(
      sql`(${quotation.createdBy}).user_id = ${userId}`,
      inArray(quotation.status, ['approved', 'rejected']),
    );

    const [items, totalResult] = await Promise.all([
      this.db
        .select({
          id: quotation.id,
          quotationNo: quotation.quotationNo,
          customerShortName: quotation.customerShortName,
          totalAmount: quotation.totalAmount,
          status: quotation.status,
          createdAt: quotation.createdAt,
        })
        .from(quotation)
        .where(whereClause)
        .orderBy(desc(quotation.createdAt)),
      this.db
        .select({ count: count() })
        .from(quotation)
        .where(whereClause),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        totalAmount: Number(item.totalAmount),
        createdAt: item.createdAt.toISOString(),
      })),
      total: Number(totalResult[0]?.count ?? 0),
    };
  }

  async getMyDraftQuotations(userId: string) {
    const whereClause = and(
      sql`(${quotation.createdBy}).user_id = ${userId}`,
      eq(quotation.status, 'draft'),
    );

    const [items, totalResult] = await Promise.all([
      this.db
        .select({
          id: quotation.id,
          quotationNo: quotation.quotationNo,
          customerShortName: quotation.customerShortName,
          totalAmount: quotation.totalAmount,
          status: quotation.status,
          createdAt: quotation.createdAt,
        })
        .from(quotation)
        .where(whereClause)
        .orderBy(desc(quotation.createdAt)),
      this.db
        .select({ count: count() })
        .from(quotation)
        .where(whereClause),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        totalAmount: Number(item.totalAmount),
        createdAt: item.createdAt.toISOString(),
      })),
      total: Number(totalResult[0]?.count ?? 0),
    };
  }

  async getStatusCounts(userId: string) {
    const result = await this.db
      .select({
        status: quotation.status,
        count: count(),
      })
      .from(quotation)
      .where(sql`(${quotation.createdBy}).user_id = ${userId}`)
      .groupBy(quotation.status);

    const counts: Record<string, number> = {
      draft: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
    };
    for (const row of result) {
      counts[row.status] = Number(row.count);
    }
    return counts;
  }
}

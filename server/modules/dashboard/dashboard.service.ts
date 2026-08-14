import { Injectable, Inject, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/lib/platform';
import {
  customerLevel,
  priceSensitivity,
  creditTerm,
  purchaseQuantity,
  logisticsCost,
  otherDiscount,
} from '@server/database/schema';
import { count } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type { DashboardStats, RecentUpdateItem, RecentUpdatesResponse } from '@shared/api.interface';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getStats(): Promise<DashboardStats> {
    try {
      const [clResult, psResult, ctResult, pqResult, lcResult, odResult] =
        await Promise.all([
          this.db.select({ count: count() }).from(customerLevel),
          this.db.select({ count: count() }).from(priceSensitivity),
          this.db.select({ count: count() }).from(creditTerm),
          this.db.select({ count: count() }).from(purchaseQuantity),
          this.db.select({ count: count() }).from(logisticsCost),
          this.db.select({ count: count() }).from(otherDiscount),
        ]);

      return {
        customerLevelCount: Number(clResult[0]?.count ?? 0),
        priceSensitivityCount: Number(psResult[0]?.count ?? 0),
        creditTermCount: Number(ctResult[0]?.count ?? 0),
        purchaseQuantityCount: Number(pqResult[0]?.count ?? 0),
        logisticsCostCount: Number(lcResult[0]?.count ?? 0),
        otherDiscountCount: Number(odResult[0]?.count ?? 0),
      };
    } catch (error) {
      this.logger.error('获取统计信息失败', JSON.stringify(error));
      throw error;
    }
  }

  async getRecentUpdates(): Promise<RecentUpdatesResponse> {
    try {
      const result = await this.db.execute(sql`
        SELECT * FROM (
          SELECT
            id,
            'customer_level' AS type,
            name AS name,
            _updated_at AS updated_at,
            (_updated_by).user_id AS updated_by_user_id
          FROM customer_level

          UNION ALL

          SELECT
            id,
            'price_sensitivity' AS type,
            region AS name,
            _updated_at AS updated_at,
            (_updated_by).user_id AS updated_by_user_id
          FROM price_sensitivity

          UNION ALL

          SELECT
            id,
            'credit_term' AS type,
            category AS name,
            _updated_at AS updated_at,
            (_updated_by).user_id AS updated_by_user_id
          FROM credit_term

          UNION ALL

          SELECT
            id,
            'purchase_quantity' AS type,
            type_desc AS name,
            _updated_at AS updated_at,
            (_updated_by).user_id AS updated_by_user_id
          FROM purchase_quantity

          UNION ALL

          SELECT
            id,
            'logistics_cost' AS type,
            cost_type AS name,
            _updated_at AS updated_at,
            (_updated_by).user_id AS updated_by_user_id
          FROM logistics_cost

          UNION ALL

          SELECT
            id,
            'other_discount' AS type,
            discount_type AS name,
            _updated_at AS updated_at,
            (_updated_by).user_id AS updated_by_user_id
          FROM other_discount
        ) AS all_updates
        ORDER BY updated_at DESC
        LIMIT 10
      `);

      const items: RecentUpdateItem[] = (result as unknown as Array<{
        id: string;
        type: string;
        name: string;
        updated_at: string;
        updated_by_user_id: string;
      }>).map((row) => ({
        id: row.id,
        type: row.type,
        name: row.name,
        updatedAt: row.updated_at,
        updatedBy: {
          userId: row.updated_by_user_id ?? '',
          userName: '',
        },
      }));

      return { items };
    } catch (error) {
      this.logger.error('获取最近更新失败', JSON.stringify(error));
      throw error;
    }
  }
}

import {
  Injectable,
  Inject,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@server/lib/platform';
import {
  exchangeRiskRate,
  taxRate,
  alertThreshold,
} from '@server/database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class GlobalConfigService {
  private readonly logger = new Logger(GlobalConfigService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE)
    private readonly db: PostgresJsDatabase,
  ) {}

  async getExchangeRiskRate() {
    const rows = await this.db
      .select({
        id: exchangeRiskRate.id,
        rate: exchangeRiskRate.rate,
        updatedAt: exchangeRiskRate.updatedAt,
      })
      .from(exchangeRiskRate)
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException(
        '汇率风险准备金率配置不存在',
      );
    }

    return {
      ...rows[0],
      rate: Number(rows[0].rate),
      updatedAt: rows[0].updatedAt.toISOString(),
    };
  }

  async updateExchangeRiskRate(rate: number) {
    const rows = await this.db
      .select({ id: exchangeRiskRate.id })
      .from(exchangeRiskRate)
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException(
        '汇率风险准备金率配置不存在',
      );
    }

    const result = await this.db
      .update(exchangeRiskRate)
      .set({ rate: String(rate) })
      .where(eq(exchangeRiskRate.id, rows[0].id))
      .returning({
        id: exchangeRiskRate.id,
        rate: exchangeRiskRate.rate,
        updatedAt: exchangeRiskRate.updatedAt,
      });

    return {
      ...result[0],
      rate: Number(result[0].rate),
      updatedAt: result[0].updatedAt.toISOString(),
    };
  }

  async getTaxRate() {
    const rows = await this.db
      .select({
        id: taxRate.id,
        rate: taxRate.rate,
        updatedAt: taxRate.updatedAt,
      })
      .from(taxRate)
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('税率配置不存在');
    }

    return {
      ...rows[0],
      rate: Number(rows[0].rate),
      updatedAt: rows[0].updatedAt.toISOString(),
    };
  }

  async updateTaxRate(rate: number) {
    const rows = await this.db
      .select({ id: taxRate.id })
      .from(taxRate)
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('税率配置不存在');
    }

    const result = await this.db
      .update(taxRate)
      .set({ rate: String(rate) })
      .where(eq(taxRate.id, rows[0].id))
      .returning({
        id: taxRate.id,
        rate: taxRate.rate,
        updatedAt: taxRate.updatedAt,
      });

    return {
      ...result[0],
      rate: Number(result[0].rate),
      updatedAt: result[0].updatedAt.toISOString(),
    };
  }

  async getAlertThreshold() {
    const rows = await this.db
      .select({
        id: alertThreshold.id,
        highPercent: alertThreshold.highPercent,
        midPercent: alertThreshold.midPercent,
        updatedAt: alertThreshold.updatedAt,
      })
      .from(alertThreshold)
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('告警阈值配置不存在');
    }

    return {
      ...rows[0],
      highPercent: Number(rows[0].highPercent),
      midPercent: Number(rows[0].midPercent),
      updatedAt: rows[0].updatedAt.toISOString(),
    };
  }

  async updateAlertThreshold(
    highPercent: number,
    midPercent: number,
  ) {
    const rows = await this.db
      .select({ id: alertThreshold.id })
      .from(alertThreshold)
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('告警阈值配置不存在');
    }

    const result = await this.db
      .update(alertThreshold)
      .set({
        highPercent: String(highPercent),
        midPercent: String(midPercent),
      })
      .where(eq(alertThreshold.id, rows[0].id))
      .returning({
        id: alertThreshold.id,
        highPercent: alertThreshold.highPercent,
        midPercent: alertThreshold.midPercent,
        updatedAt: alertThreshold.updatedAt,
      });

    return {
      ...result[0],
      highPercent: Number(result[0].highPercent),
      midPercent: Number(result[0].midPercent),
      updatedAt: result[0].updatedAt.toISOString(),
    };
  }
}

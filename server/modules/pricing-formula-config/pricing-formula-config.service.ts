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
import { pricingFormulaConfig } from '@server/database/schema';
import { eq } from 'drizzle-orm';
import type { PricingFormulaValue } from '@shared/pricing-formula-config';

const DEFAULT_CONFIG_VALUE: PricingFormulaValue = {
  formulaVersion: 'v1',
  gradeFactor: 1,
  sensitivityFactor: 1,
  logisticsFactor: 1,
  insuranceFactor: 1,
  creditFactor: 1,
  quantityFactor: 1,
  exchangeRiskRate: 0.02,
  defaultTargetMargin: 0.3,
  flexibleReserveRate: 0,
  taxRate: 0.13,
};

@Injectable()
export class PricingFormulaConfigService {
  private readonly logger = new Logger(
    PricingFormulaConfigService.name,
  );

  constructor(
    @Inject(DRIZZLE_DATABASE)
    private readonly db: PostgresJsDatabase,
  ) {}

  async getConfig() {
    const rows = await this.db
      .select()
      .from(pricingFormulaConfig)
      .where(eq(pricingFormulaConfig.configKey, 'default'))
      .limit(1);

    if (rows.length === 0) {
      this.logger.warn(
        'No default pricing formula config found, returning defaults',
      );
      return {
        configValue: DEFAULT_CONFIG_VALUE,
        description: 'Default pricing formula configuration',
        updatedAt: new Date().toISOString(),
      };
    }

    const row = rows[0];
    return {
      id: row.id,
      configKey: row.configKey,
      configValue: row.configValue as PricingFormulaValue,
      description: row.description,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async updateConfig(configValue: Record<string, unknown>) {
    const result = await this.db
      .update(pricingFormulaConfig)
      .set({ configValue })
      .where(eq(pricingFormulaConfig.configKey, 'default'))
      .returning();

    if (result.length === 0) {
      throw new NotFoundException(
        'Pricing formula config not found',
      );
    }

    const row = result[0];
    return {
      id: row.id,
      configKey: row.configKey,
      configValue: row.configValue as PricingFormulaValue,
      description: row.description,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async resetToDefault() {
    const result = await this.db
      .update(pricingFormulaConfig)
      .set({ configValue: DEFAULT_CONFIG_VALUE })
      .where(eq(pricingFormulaConfig.configKey, 'default'))
      .returning();

    if (result.length === 0) {
      throw new NotFoundException(
        'Pricing formula config not found',
      );
    }

    const row = result[0];
    return {
      id: row.id,
      configKey: row.configKey,
      configValue: row.configValue as PricingFormulaValue,
      description: row.description,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

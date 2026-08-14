import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@server/lib/platform';
import {
  customer,
  afterSalesReserve,
  excessMarketingExpense,
  productGradeMargin,
  product,
  customerLevel,
  priceSensitivity,
  creditTerm,
  purchaseQuantity,
  logisticsCost,
  otherDiscount,
  insuranceCoefficient,
  exchangeRiskRate,
  taxRate,
  customFeeConfig,
  grossMarginTargetOld,
  channelType,
  alertThreshold,
} from '@server/database/schema';
import { count, sql } from 'drizzle-orm';
import * as XLSX from 'xlsx';
import {
  SEED_CATEGORIES,
  SEED_CUSTOMER_LEVELS,
  SEED_CHANNEL_TYPES,
  SEED_PRICE_SENSITIVITY,
  SEED_CREDIT_TERMS,
  SEED_PURCHASE_QUANTITIES,
  SEED_LOGISTICS_COSTS,
  SEED_OTHER_DISCOUNTS,
  SEED_INSURANCE_COEFFICIENTS,
  SEED_CUSTOM_FEE_CONFIGS,
  SEED_GROSS_MARGIN_TARGET_MAP,
} from './seed-data';

export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

@Injectable()
export class DataImportService {
  private readonly logger = new Logger(DataImportService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private parseExcel(file: string): Record<string, unknown>[] {
    const buffer = Buffer.from(file, 'base64');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return [];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  }

  private parseJson<T>(file: string): T[] {
    const buffer = Buffer.from(file, 'base64');
    const text = buffer.toString('utf-8');
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  }

  async importCustomers(file: string): Promise<ImportResult> {
    const rows = this.parseExcel(file);
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel row number (1-indexed + header row)
      try {
        const shortName = String(row['客户简称'] ?? '').trim();
        if (!shortName) {
          errors.push(`第${rowNum}行: 客户简称不能为空`);
          failed++;
          continue;
        }

        const gradeVal = String(row['客户等级'] ?? '')
          .trim()
          .replace(/级$/, '');

        await this.db.insert(customer).values({
          shortName,
          fullName: String(row['客户全称'] ?? '').trim(),
          country: String(row['国家'] ?? '').trim(),
          region: String(row['区域'] ?? '').trim(),
          channelType: String(row['渠道类型'] ?? '').trim(),
          creditCondition: String(row['信用条件'] ?? '').trim(),
          grade: gradeVal || '无',
        });
        success++;
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes('duplicate key') || msg.includes('unique')) {
          errors.push(`第${rowNum}行: 客户简称已存在，跳过`);
        } else {
          errors.push(`第${rowNum}行: ${msg}`);
        }
        failed++;
      }
    }

    this.logger.log(`客户导入完成: 成功${success}, 失败${failed}`);
    return { success, failed, errors };
  }

  async importAfterSalesReserve(file: string): Promise<ImportResult> {
    const rows = this.parseJson<{
      customerShortName: string;
      rate: string;
    }>(file);
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;
      try {
        const customerShortName = String(
          row.customerShortName ?? '',
        ).trim();
        if (!customerShortName) {
          errors.push(`第${rowNum}行: 客户简称不能为空`);
          failed++;
          continue;
        }

        const rateValue = Number(row.rate);
        if (isNaN(rateValue)) {
          errors.push(`第${rowNum}行: 售后准备金率格式错误`);
          failed++;
          continue;
        }

        await this.db.insert(afterSalesReserve).values({
          customerShortName,
          rate: String(rateValue),
        });
        success++;
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes('duplicate key') || msg.includes('unique')) {
          errors.push(`第${rowNum}行: 客户简称已存在，跳过`);
        } else {
          errors.push(`第${rowNum}行: ${msg}`);
        }
        failed++;
      }
    }

    this.logger.log(
      `售后准备金率导入完成: 成功${success}, 失败${failed}`,
    );
    return { success, failed, errors };
  }

  async importExcessMarketingExpense(
    file: string,
  ): Promise<ImportResult> {
    const rows = this.parseJson<{
      customerShortName: string;
      rate: string;
    }>(file);
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;
      try {
        const customerShortName = String(
          row.customerShortName ?? '',
        ).trim();
        if (!customerShortName) {
          errors.push(`第${rowNum}行: 客户简称不能为空`);
          failed++;
          continue;
        }

        const rateValue = Number(row.rate);
        if (isNaN(rateValue)) {
          errors.push(`第${rowNum}行: 超额营销费用率格式错误`);
          failed++;
          continue;
        }

        await this.db.insert(excessMarketingExpense).values({
          customerShortName,
          rate: String(rateValue),
        });
        success++;
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes('duplicate key') || msg.includes('unique')) {
          errors.push(`第${rowNum}行: 客户简称已存在，跳过`);
        } else {
          errors.push(`第${rowNum}行: ${msg}`);
        }
        failed++;
      }
    }

    this.logger.log(
      `超额营销费用率导入完成: 成功${success}, 失败${failed}`,
    );
    return { success, failed, errors };
  }

  async importGrossMarginNew(file: string): Promise<ImportResult> {
    const rows = this.parseExcel(file);
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;
      try {
        const category = String(row['品类'] ?? '').trim();
        const productGradeVal = String(
          row['产品等级'] ?? '',
        ).trim();

        if (!category) {
          errors.push(`第${rowNum}行: 品类不能为空`);
          failed++;
          continue;
        }
        if (!productGradeVal) {
          errors.push(`第${rowNum}行: 产品等级不能为空`);
          failed++;
          continue;
        }

        const marginValue = Number(row['目标毛利率'] ?? 0);
        if (isNaN(marginValue)) {
          errors.push(`第${rowNum}行: 目标毛利率格式错误`);
          failed++;
          continue;
        }

        await this.db.insert(productGradeMargin).values({
          category,
          productGrade: productGradeVal,
          targetMargin: String(marginValue / 100),
          customerLevelId: '00000000-0000-0000-0000-000000000000',
          salesRatio: '0',
          marginContribution: '0',
        });
        success++;
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes('duplicate key') || msg.includes('unique')) {
          errors.push(
            `第${rowNum}行: 品类+客户等级组合已存在，跳过`,
          );
        } else {
          errors.push(`第${rowNum}行: ${msg}`);
        }
        failed++;
      }
    }

    this.logger.log(
      `产品等级毛利率导入完成: 成功${success}, 失败${failed}`,
    );
    return { success, failed, errors };
  }

  async clearAllProducts(): Promise<{ deleted: number }> {
    const result = await this.db
      .delete(product)
      .returning({ id: product.id });
    this.logger.log(`已清空产品表，共删除${result.length}条`);
    return { deleted: result.length };
  }

  async clearAllCustomers(): Promise<{ deleted: number }> {
    const result = await this.db
      .delete(customer)
      .returning({ id: customer.id });
    this.logger.log(`已清空客户表，共删除${result.length}条`);
    return { deleted: result.length };
  }

  async clearAllMarginNew(): Promise<{ deleted: number }> {
    const result = await this.db
      .delete(productGradeMargin)
      .returning({ id: productGradeMargin.id });
    this.logger.log(
      `已清空产品等级毛利率表，共删除${result.length}条`,
    );
    return { deleted: result.length };
  }

  async clearAllAfterSales(): Promise<{ deleted: number }> {
    const result = await this.db
      .delete(afterSalesReserve)
      .returning({ id: afterSalesReserve.id });
    this.logger.log(
      `已清空售后准备金率表，共删除${result.length}条`,
    );
    return { deleted: result.length };
  }

  async clearAllExcessMarketing(): Promise<{ deleted: number }> {
    const result = await this.db
      .delete(excessMarketingExpense)
      .returning({ id: excessMarketingExpense.id });
    this.logger.log(
      `已清空超额营销费用率表，共删除${result.length}条`,
    );
    return { deleted: result.length };
  }

  private async tableCount(
    table: Parameters<
      ReturnType<PostgresJsDatabase['select']>['from']
    >[0],
  ): Promise<number> {
    const res = await this.db
      .select({ count: count() })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(table as any);
    return Number(res[0]?.count ?? 0);
  }

  async seedDemoData(): Promise<{
    seededTables: string[];
    skippedTables: string[];
  }> {
    const seededTables: string[] = [];
    const skippedTables: string[] = [];

    const tables = [
      { name: 'customer_level', ref: customerLevel },
      { name: 'price_sensitivity', ref: priceSensitivity },
      { name: 'credit_term', ref: creditTerm },
      { name: 'purchase_quantity', ref: purchaseQuantity },
      { name: 'logistics_cost', ref: logisticsCost },
      { name: 'other_discount', ref: otherDiscount },
      { name: 'insurance_coefficient', ref: insuranceCoefficient },
      { name: 'exchange_risk_rate', ref: exchangeRiskRate },
      { name: 'tax_rate', ref: taxRate },
      { name: 'custom_fee_config', ref: customFeeConfig },
      { name: 'channel_type', ref: channelType },
      { name: 'alert_threshold', ref: alertThreshold },
      { name: 'after_sales_reserve', ref: afterSalesReserve },
      { name: 'excess_marketing_expense', ref: excessMarketingExpense },
      { name: 'gross_margin_target_old', ref: grossMarginTargetOld },
      { name: 'product_grade_margin', ref: productGradeMargin },
    ];

    const counts: Record<string, number> = {};
    await Promise.all(
      tables.map(async (t) => {
        counts[t.name] = await this.tableCount(t.ref);
      }),
    );

    await this.db.transaction(async (tx) => {
      // customer_level
      if (counts.customer_level === 0) {
        await tx.insert(customerLevel).values(SEED_CUSTOMER_LEVELS);
        seededTables.push('customer_level');
      } else {
        skippedTables.push('customer_level');
      }

      // price_sensitivity
      if (counts.price_sensitivity === 0) {
        await tx.insert(priceSensitivity).values(SEED_PRICE_SENSITIVITY);
        seededTables.push('price_sensitivity');
      } else {
        skippedTables.push('price_sensitivity');
      }

      // credit_term
      if (counts.credit_term === 0) {
        await tx.insert(creditTerm).values(SEED_CREDIT_TERMS);
        seededTables.push('credit_term');
      } else {
        skippedTables.push('credit_term');
      }

      // purchase_quantity
      if (counts.purchase_quantity === 0) {
        await tx.insert(purchaseQuantity).values(SEED_PURCHASE_QUANTITIES);
        seededTables.push('purchase_quantity');
      } else {
        skippedTables.push('purchase_quantity');
      }

      // logistics_cost
      if (counts.logistics_cost === 0) {
        await tx.insert(logisticsCost).values(SEED_LOGISTICS_COSTS);
        seededTables.push('logistics_cost');
      } else {
        skippedTables.push('logistics_cost');
      }

      // other_discount
      if (counts.other_discount === 0) {
        await tx.insert(otherDiscount).values(SEED_OTHER_DISCOUNTS);
        seededTables.push('other_discount');
      } else {
        skippedTables.push('other_discount');
      }

      // insurance_coefficient
      if (counts.insurance_coefficient === 0) {
        await tx
          .insert(insuranceCoefficient)
          .values(SEED_INSURANCE_COEFFICIENTS);
        seededTables.push('insurance_coefficient');
      } else {
        skippedTables.push('insurance_coefficient');
      }

      // exchange_risk_rate
      if (counts.exchange_risk_rate === 0) {
        await tx.insert(exchangeRiskRate).values({ rate: '0.02' });
        seededTables.push('exchange_risk_rate');
      } else {
        skippedTables.push('exchange_risk_rate');
      }

      // tax_rate
      if (counts.tax_rate === 0) {
        await tx.insert(taxRate).values({ rate: '0.13' });
        seededTables.push('tax_rate');
      } else {
        skippedTables.push('tax_rate');
      }

      // custom_fee_config
      if (counts.custom_fee_config === 0) {
        await tx.insert(customFeeConfig).values(
          SEED_CUSTOM_FEE_CONFIGS.map((name) => ({ name })),
        );
        seededTables.push('custom_fee_config');
      } else {
        skippedTables.push('custom_fee_config');
      }

      // channel_type
      if (counts.channel_type === 0) {
        await tx.insert(channelType).values(
          SEED_CHANNEL_TYPES.map((name) => ({ name })),
        );
        seededTables.push('channel_type');
      } else {
        skippedTables.push('channel_type');
      }

      // alert_threshold
      if (counts.alert_threshold === 0) {
        await tx.insert(alertThreshold).values({
          highPercent: '0.80',
          midPercent: '0.10',
        });
        seededTables.push('alert_threshold');
      } else {
        skippedTables.push('alert_threshold');
      }

      // 按客户生成 after_sales_reserve / excess_marketing / gross_margin_target_old
      const existingCustomers = await tx
        .select({ shortName: customer.shortName })
        .from(customer);
      const customerNames = existingCustomers.map(
        (c: { shortName: string }) => c.shortName,
      );

      if (
        counts.after_sales_reserve === 0 &&
        customerNames.length > 0
      ) {
        await tx.insert(afterSalesReserve).values(
          customerNames.map((n) => ({
            customerShortName: n,
            rate: '0.02',
          })),
        );
        seededTables.push('after_sales_reserve');
      } else {
        skippedTables.push('after_sales_reserve');
      }

      if (
        counts.excess_marketing_expense === 0 &&
        customerNames.length > 0
      ) {
        await tx.insert(excessMarketingExpense).values(
          customerNames.map((n) => ({
            customerShortName: n,
            rate: '0',
          })),
        );
        seededTables.push('excess_marketing_expense');
      } else {
        skippedTables.push('excess_marketing_expense');
      }

      if (
        counts.gross_margin_target_old === 0 &&
        customerNames.length > 0
      ) {
        await tx.insert(grossMarginTargetOld).values(
          customerNames.map((n) => ({
            customerShortName: n,
            model: '默认型号',
            targetMargin: '0.30',
          })),
        );
        seededTables.push('gross_margin_target_old');
      } else {
        skippedTables.push('gross_margin_target_old');
      }

      // product_grade_margin: 8 品类 × 4 等级 = 32 条
      // 先拿到 4 个 customer_level 的 id
      if (counts.product_grade_margin === 0) {
        const levels = await tx
          .select({ id: customerLevel.id, name: customerLevel.name })
          .from(customerLevel);
        const levelMap = new Map<string, string>();
        for (const l of levels) {
          levelMap.set(l.name, l.id);
        }

        const rows: Array<{
          category: string;
          customerLevelId: string;
          productGrade: string;
          targetMargin: string;
          marginRedline: string;
          salesRatio: string;
          marginContribution: string;
        }> = [];

        for (const [levelName, categoryMap] of Object.entries(
          SEED_GROSS_MARGIN_TARGET_MAP,
        )) {
          const levelId = levelMap.get(levelName);
          if (!levelId) continue;
          for (const [cat, margin] of Object.entries(categoryMap)) {
            rows.push({
              category: cat,
              customerLevelId: levelId,
              productGrade: levelName,
              targetMargin: margin,
              marginRedline: '0.80',
              salesRatio: '0',
              marginContribution: '0',
            });
          }
        }

        if (rows.length > 0) {
          await tx.insert(productGradeMargin).values(rows);
          seededTables.push('product_grade_margin');
        } else {
          skippedTables.push('product_grade_margin');
        }
      } else {
        skippedTables.push('product_grade_margin');
      }
    });

    this.logger.log(
      `seed 完成：初始化 ${seededTables.length} 张表 (${seededTables.join(',') || '无'})，跳过 ${skippedTables.length} 张 (${skippedTables.join(',') || '无'})`,
    );
    return { seededTables, skippedTables };
  }

  async needsSeed(): Promise<boolean> {
    try {
      const emptyTables = [
        customerLevel,
        priceSensitivity,
        creditTerm,
        purchaseQuantity,
        logisticsCost,
        otherDiscount,
        taxRate,
        exchangeRiskRate,
        alertThreshold,
      ];
      const results = await Promise.all(
        emptyTables.map((t) => this.tableCount(t)),
      );
      return results.some((c) => c === 0);
    } catch (error) {
      this.logger.error(
        `检测是否需要 seed 失败: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }
}

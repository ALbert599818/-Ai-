import { Logger } from '@nestjs/common';
import { type PostgresJsDatabase } from '@server/lib/platform';
import * as schema from '@server/database/schema';
import { eq, and } from 'drizzle-orm';
import type {
  QuotationCalculateRequest,
  QuotationCalculateResponse,
  CalculatedQuotationItem,
} from '@shared/quotation';
import type { PricingFormulaValue } from '@shared/pricing-formula-config';

const logger = new Logger('PricingEngine');

// ============================================================
// Local extended types (to be migrated to shared/quotation.ts)
// ============================================================

/** Extended request with optional fields from new requirements */
interface LocalRequest extends QuotationCalculateRequest {
  categoryGrades?: Record<string, string>;
  exchangeRate?: number;
}

/** Extended item with intermediate calculation values */
interface ExtendedItem extends CalculatedQuotationItem {
  baseCost: number;
  benchmarkPrice: number;
  kTotal: number;
  discountedPrice: number;
  priceWithChannelFee: number;
  foreignCurrencyPrice: number;
}

// ============================================================
// Default config
// ============================================================

const DEFAULT_FORMULA_CONFIG: PricingFormulaValue = {
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

// ============================================================
// Coefficient matching helpers
// ============================================================

/** Match customer level by grade name (with fuzzy fallback) */
function matchCustomerLevel(
  levels: Array<{ id: string; name: string; discount: string | number }>,
  grade: string,
): { id: string; name: string; discount: string | number } | undefined {
  return (
    levels.find((l) => l.name === grade) ??
    levels.find((l) => l.name === grade + '级') ??
    levels.find((l) => l.name === grade.replace(/级$/, ''))
  );
}

/** Match quantity coefficient by moq multiple */
function matchQuantityCoefficient(
  purchaseQuantities: Array<{
    discount: string | number;
    minMultiple: string | number;
    maxMultiple: string | number;
  }>,
  moqMultiple: number,
): number {
  const pqRow = purchaseQuantities.find(
    (p) =>
      moqMultiple >= Number(p.minMultiple) &&
      moqMultiple <= Number(p.maxMultiple),
  );
  return Number(pqRow?.discount ?? 1);
}

/**
 * Determine target margin for a product item.
 * - New product: product_grade_margin by category + categoryGrade
 * - Old product: gross_margin_target_old by customerShortName + model
 * - Fallback: defaultTargetMargin from config
 */
function determineTargetMargin(params: {
  isNewProduct: boolean;
  category: string;
  productGrade: string;
  model: string;
  customerShortName: string;
  productGradeMargins: Array<{
    category: string;
    productGrade: string;
    targetMargin: string | number;
  }>;
  grossMarginTargetsOld: Array<{
    customerShortName: string;
    model: string;
    targetMargin: string | number;
  }>;
  defaultTargetMargin: number;
}): number {
  const {
    isNewProduct,
    category,
    productGrade,
    model,
    customerShortName,
    productGradeMargins,
    grossMarginTargetsOld,
    defaultTargetMargin,
  } = params;

  if (isNewProduct) {
    // Match by category + productGrade
    const pgmRow = productGradeMargins.find(
      (p) => p.category === category && p.productGrade === productGrade,
    );
    if (pgmRow) return Number(pgmRow.targetMargin);
  } else {
    // Old product: match by customerShortName + model
    const oldRow = grossMarginTargetsOld.find(
      (g) => g.customerShortName === customerShortName && g.model === model,
    );
    if (oldRow) return Number(oldRow.targetMargin);
    // Fallback: productGradeMargin by category + productGrade
    const pgmRow = productGradeMargins.find(
      (p) => p.category === category && p.productGrade === productGrade,
    );
    if (pgmRow) return Number(pgmRow.targetMargin);
  }

  return defaultTargetMargin;
}

/** Compute three-level alert based on actual vs target margin */
function computeAlert(
  actualMargin: number,
  targetMargin: number,
  highPercent: number,
  midPercent: number,
): { alertLevel: 'none' | 'yellow' | 'red'; alertMsg: string } {
  const highThreshold = targetMargin * highPercent;

  if (actualMargin > highThreshold) {
    return { alertLevel: 'none', alertMsg: '' };
  }
  if (actualMargin > midPercent) {
    return {
      alertLevel: 'yellow',
      alertMsg: `毛利率 ${(actualMargin * 100).toFixed(1)}% 低于目标${Math.round(highPercent * 100)}%阈值 (${(highThreshold * 100).toFixed(1)}%)`,
    };
  }
  return {
    alertLevel: 'red',
    alertMsg: `毛利率 ${(actualMargin * 100).toFixed(1)}% 低于目标${Math.round(midPercent * 100)}%安全阈值`,
  };
}

/** Build an error item for failed calculations */
function buildErrorItem(
  model: string,
  color: string,
  errorMsg: string,
): ExtendedItem {
  return {
    model,
    color,
    category: '',
    productGrade: '',
    purchaseCost: 0,
    rdCost: 0,
    moq: 0,
    quantity: 0,
    targetMargin: 0,
    baseCost: 0,
    benchmarkPrice: 0,
    kTotal: 0,
    discountedPrice: 0,
    priceWithChannelFee: 0,
    foreignCurrencyPrice: 0,
    unitPrice: 0,
    totalPrice: 0,
    actualMargin: 0,
    alertLevel: 'red',
    alertMsg: errorMsg,
  };
}

// ============================================================
// Main calculation function
// ============================================================

export async function calculateQuotation(
  db: PostgresJsDatabase,
  request: QuotationCalculateRequest,
): Promise<QuotationCalculateResponse> {
  const req = request as LocalRequest;
  const exchangeRate = Number(req.exchangeRate ?? 1) || 1;

  // ========== 1. Load formula config ==========
  let formulaConfig: PricingFormulaValue = DEFAULT_FORMULA_CONFIG;
  try {
    const configRows = await db
      .select()
      .from(schema.pricingFormulaConfig)
      .where(eq(schema.pricingFormulaConfig.configKey, 'default'))
      .limit(1);
    if (configRows.length > 0) {
      formulaConfig = {
        ...DEFAULT_FORMULA_CONFIG,
        ...(configRows[0].configValue as Record<string, unknown>),
      } as PricingFormulaValue;
    }
  } catch (err) {
    logger.warn(
      'Failed to load pricing formula config, using defaults: ' +
        JSON.stringify(err),
    );
  }

  const cfgDefaultTargetMargin = Number(
    formulaConfig.defaultTargetMargin ?? 0.3,
  );
  const cfgExchangeRiskRate = Number(formulaConfig.exchangeRiskRate ?? 0.02);

  // ========== 2. Load all coefficient data in parallel ==========
  const [
    customerLevels,
    priceSensitivities,
    creditTerms,
    insuranceCoeffs,
    logisticsCosts,
    afterSalesReserves,
    excessMarketingExpenses,
    purchaseQuantities,
    alertThresholds,
    grossMarginTargetsOld,
    productGradeMargins,
  ] = await Promise.all([
    db.select().from(schema.customerLevel),
    db.select().from(schema.priceSensitivity),
    db.select().from(schema.creditTerm),
    db.select().from(schema.insuranceCoefficient),
    db.select().from(schema.logisticsCost),
    db.select().from(schema.afterSalesReserve),
    db.select().from(schema.excessMarketingExpense),
    db.select().from(schema.purchaseQuantity),
    db.select().from(schema.alertThreshold),
    db.select().from(schema.grossMarginTargetOld),
    db.select().from(schema.productGradeMargin),
  ]);

  // ========== 3. Alert thresholds ==========
  const highPercent = Number(alertThresholds[0]?.highPercent ?? 0.8);
  const midPercent = Number(alertThresholds[0]?.midPercent ?? 0.1);

  // ========== 4. Order-level coefficient matching ==========

  // Grade coefficient: match by customer grade
  const gradeLevel = matchCustomerLevel(customerLevels, req.grade);
  const gradeCoefficient = Number(gradeLevel?.discount ?? 1);
  if (!gradeLevel) {
    logger.warn(`客户等级 "${req.grade}" 未匹配到系数，使用默认值 1`);
  }

  // Price sensitivity: region + channelType
  const sensitivityRow =
    priceSensitivities.find(
      (p) =>
        p.region === req.region && p.mode === req.channelType,
    ) ??
    priceSensitivities.find((p) => p.region === req.region);
  const sensitivityCoefficient = Number(sensitivityRow?.discount ?? 1);
  if (!sensitivityRow) {
    logger.warn(
      `价格敏感系数 区域="${req.region}" 渠道="${req.channelType}" 未匹配，使用默认值 1`,
    );
  }

  // Credit coefficient: match creditCondition to creditTerm.subItem
  const creditRow = creditTerms.find(
    (c) => c.subItem === req.creditCondition,
  );
  const creditCoefficient = Number(creditRow?.discount ?? 1);
  if (!creditRow) {
    logger.warn(
      `信用条件 "${req.creditCondition}" 未匹配到系数，使用默认值 1`,
    );
  }

  // Insurance coefficient: match creditCondition (DB stores rate like 0.01 = 1%, convert to 1.01 for K total)
  const insuranceRow = insuranceCoeffs.find(
    (i) => i.creditCondition === req.creditCondition,
  );
  const insuranceCoefficient = 1 + Number(insuranceRow?.coefficient ?? 0);
  if (!insuranceRow) {
    logger.warn(
      `保费系数 信用条件="${req.creditCondition}" 未匹配，使用默认值 1`,
    );
  }

  // Logistics coefficient (order-level snapshot from request.logisticsType)
  const orderLogisticsRow = logisticsCosts.find(
    (l) => l.costType === req.logisticsType,
  );
  const orderLogisticsCoefficient = Number(orderLogisticsRow?.discount ?? 1);
  if (!orderLogisticsRow) {
    logger.warn(
      `物流成本 "${req.logisticsType}" 未匹配到系数，使用默认值 1`,
    );
  }

  // After-sales reserve rate: match customerShortName; new customer → 0
  const afterSalesRow = afterSalesReserves.find(
    (a) => a.customerShortName === req.customerShortName,
  );
  const afterSalesRate = Number(afterSalesRow?.rate ?? 0);

  // Excess marketing expense rate: match customerShortName; new customer → 0
  const marketingRow = excessMarketingExpenses.find(
    (m) => m.customerShortName === req.customerShortName,
  );
  const marketingExpenseRate = Number(marketingRow?.rate ?? 0);

  // Exchange risk rate from config
  const exchangeRiskRateVal = cfgExchangeRiskRate;

  // ========== 5. Per-item calculation ==========
  const calculatedItems: ExtendedItem[] = [];
  let firstQuantityCoefficient = 1;

  for (const item of req.items) {
    try {
      // --- 5a. Look up product ---
      const productRows = await db
        .select()
        .from(schema.product)
        .where(
          and(
            eq(schema.product.model, item.model),
            eq(schema.product.color, item.color),
          ),
        )
        .limit(1);
      const prod = productRows[0];

      if (!prod) {
        logger.warn(`产品 ${item.model}/${item.color} 不存在，跳过`);
        calculatedItems.push(
          buildErrorItem(
            item.model,
            item.color,
            `产品 ${item.model}/${item.color} 不存在`,
          ),
        );
        continue;
      }

      const purchaseCost =
        Number(prod.purchaseCost) || Number(prod.purchasePrice) || 0;
      const rdCost = Number(prod.rdCost);
      const moq = prod.moq;
      const category = prod.category;
      const productGrade = prod.productGrade;
      const isNewProduct = prod.isNewProduct;

      // --- Per-item logistics / flexible / custom fees ---
      const itemLogisticsType =
        item.logisticsType || req.logisticsType || '散货';
      const itemLogisticsRow = logisticsCosts.find(
        (l) => l.costType === itemLogisticsType,
      );
      const itemLogisticsCoefficient = Number(
        itemLogisticsRow?.discount ?? 1,
      );
      if (!itemLogisticsRow) {
        logger.warn(
          `物流成本 "${itemLogisticsType}" 未匹配到系数，使用默认值 1`,
        );
      }

      const itemFlexibleReserve =
        item.flexibleReserve ?? req.flexibleReserve ?? 0;
      const itemFlexibleIsRate =
        item.flexibleIsRate ?? req.flexibleIsRate ?? true;

      const itemCustomFees = item.customFees ?? [];
      const itemCustomFeesTotal = itemCustomFees.reduce(
        (sum: number, f: { feeName: string; feeAmount: number }) =>
          sum + (Number(f.feeAmount) || 0),
        0,
      );

      // --- 5b. Determine target margin ---
      const targetMargin = determineTargetMargin({
        isNewProduct,
        category,
        productGrade,
        model: item.model,
        customerShortName: req.customerShortName,
        productGradeMargins,
        grossMarginTargetsOld,
        defaultTargetMargin: cfgDefaultTargetMargin,
      });

      // --- 5c. Quantity coefficient (per item) ---
      const moqMultiple = moq > 0 ? item.quantity / moq : 0;
      const quantityCoeff = matchQuantityCoefficient(
        purchaseQuantities,
        moqMultiple,
      );
      if (calculatedItems.length === 0) {
        firstQuantityCoefficient = quantityCoeff;
      }

      // =====================================================
      // Formula chain (8 steps per requirement spec)
      // =====================================================

      // Step 1: C总 = 采购成本 + 研发费用
      const baseCost = purchaseCost + rdCost;

      // Step 2: 基准价 = C总 / (1 - G目标)
      const marginDenominator = 1 - targetMargin;
      if (marginDenominator <= 0) {
        logger.warn(
          `产品 ${item.model}: 目标毛利率 ${(targetMargin * 100).toFixed(1)}% >= 100%，使用兜底`,
        );
        calculatedItems.push(
          buildErrorItem(
            item.model,
            item.color,
            `目标毛利率 ${(targetMargin * 100).toFixed(1)}% 不合理（>=100%）`,
          ),
        );
        continue;
      }
      const benchmarkPrice = baseCost / marginDenominator;

      // Step 3: K总 = ΣKi - 5 (6 coefficients: grade, sensitivity,
      //         credit, logistics, insurance, quantity)
      const kTotal =
        gradeCoefficient +
        sensitivityCoefficient +
        creditCoefficient +
        itemLogisticsCoefficient +
        insuranceCoefficient +
        quantityCoeff -
        5;

      // Step 4: 折后价 = 基准价 × K总
      const discountedPrice = benchmarkPrice * kTotal;

      // Step 5: 折后价（含渠道费）
      let priceWithChannelFee: number;
      if (itemFlexibleIsRate) {
        // 灵活准备金为比率：折后价 × (1 + 超额营销费率 + 灵活准备金率)
        priceWithChannelFee =
          discountedPrice *
          (1 + marketingExpenseRate + itemFlexibleReserve);
      } else {
        // 灵活准备金为金额：折后价 × (1 + 超额营销费率) + 灵活准备金
        priceWithChannelFee =
          discountedPrice * (1 + marketingExpenseRate) +
          itemFlexibleReserve;
      }

      // Step 6: 外币折后价 = 折后价（含渠道费） / 汇率 × (1 + 固定汇率风险准备金率)
      const foreignCurrencyPrice =
        (priceWithChannelFee / exchangeRate) *
        (1 + exchangeRiskRateVal);

      // Unit price = foreign currency price per unit
      const unitPrice = foreignCurrencyPrice;

      // Total price for this item (含该商品的定制费用)
      let totalPrice = unitPrice * item.quantity;
      totalPrice += itemCustomFeesTotal;

      // Step 8: 实际毛利率 = (unitPrice - baseCost) / unitPrice
      const actualMargin =
        unitPrice > 0 ? (unitPrice - baseCost) / unitPrice : 0;

      // --- 5d. Three-level alert ---
      const { alertLevel, alertMsg } = computeAlert(
        actualMargin,
        targetMargin,
        highPercent,
        midPercent,
      );

      calculatedItems.push({
        model: item.model,
        color: item.color,
        category,
        productGrade,
        purchaseCost,
        rdCost,
        moq,
        quantity: item.quantity,
        targetMargin,
        baseCost,
        benchmarkPrice,
        kTotal,
        discountedPrice,
        priceWithChannelFee,
        foreignCurrencyPrice,
        unitPrice,
        totalPrice,
        actualMargin,
        alertLevel,
        alertMsg,
        logisticsType: itemLogisticsType,
        logisticsCoefficient: itemLogisticsCoefficient,
        flexibleReserveAmount: itemFlexibleIsRate
          ? discountedPrice * itemFlexibleReserve
          : itemFlexibleReserve,
        customFeesTotal: itemCustomFeesTotal,
        customFees: itemCustomFees,
      });
    } catch (err) {
      logger.warn(
        `产品 ${item.model}/${item.color} 计算异常: ` +
          JSON.stringify(err),
      );
      calculatedItems.push(
        buildErrorItem(
          item.model,
          item.color,
          `计算异常: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
    }
  }

  // ========== 6. Compute order-level totals ==========

  // Step 7: 定制费用合计 = Σ(各 item 的 customFeesTotal)
  const customFeesTotal = calculatedItems.reduce(
    (sum, i) => sum + (i.customFeesTotal ?? 0),
    0,
  );

  // 整单总报价 = Σ(itemTotalPrice)（已含各 item 定制费用）
  const itemsTotal = calculatedItems.reduce(
    (sum, i) => sum + i.totalPrice,
    0,
  );
  const totalAmount = itemsTotal;

  // 售后费用小计 = Σ(基准价 × 售后准备金率 × 数量)
  const afterSalesSubtotal = calculatedItems.reduce(
    (sum, i) => sum + i.benchmarkPrice * afterSalesRate * i.quantity,
    0,
  );

  // 营销费用小计 = Σ((价格含渠道费 - 折后价) × 数量)
  const marketingSubtotal = calculatedItems.reduce(
    (sum, i) =>
      sum + (i.priceWithChannelFee - i.discountedPrice) * i.quantity,
    0,
  );

  logger.log(
    `Calculated quotation for ${req.customerShortName}: ` +
      `${calculatedItems.length} items, total=${totalAmount.toFixed(2)}` +
      `, exchangeRate=${exchangeRate}` +
      `, formulaVersion=${formulaConfig.formulaVersion}`,
  );

  // ========== 7. Return response ==========
  return {
    // Coefficient snapshots
    gradeCoefficient,
    sensitivityCoefficient,
    creditCoefficient,
    insuranceCoefficient,
    logisticsCoefficient: orderLogisticsCoefficient,
    quantityCoefficient: firstQuantityCoefficient,
    // System parameter snapshots
    exchangeRiskRate: exchangeRiskRateVal,
    afterSalesRate,
    marketingExpenseRate,
    taxRate: Number(formulaConfig.taxRate ?? 0.13),
    // Items
    items: calculatedItems,
    // Fees and totals
    customFees: req.customFees,
    customFeesTotal,
    totalAmount,
    afterSalesSubtotal,
    marketingSubtotal,
  } as QuotationCalculateResponse & { customFeesTotal: number };
}

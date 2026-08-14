export interface PricingFormulaValue {
  formulaVersion: string;
  gradeFactor: number;
  sensitivityFactor: number;
  logisticsFactor: number;
  insuranceFactor: number;
  creditFactor: number;
  quantityFactor: number;
  exchangeRiskRate: number;
  defaultTargetMargin: number;
  flexibleReserveRate: number;
  taxRate: number;
  [key: string]: unknown;
}

export interface PricingFormulaConfigResponse {
  id: string;
  configKey: string;
  configValue: PricingFormulaValue;
  description: string;
  updatedAt: string;
}

export interface UpdatePricingFormulaConfigRequest {
  configValue: PricingFormulaValue;
}

export interface ExchangeRiskRateData {
  id: string;
  rate: number;
  updatedAt: string;
}

export interface TaxRateData {
  id: string;
  rate: number;
  updatedAt: string;
}

export interface AlertThresholdData {
  id: string;
  highPercent: number;
  midPercent: number;
  updatedAt: string;
}

export interface UpdateExchangeRiskRateRequest {
  rate: number;
}

export interface UpdateTaxRateRequest {
  rate: number;
}

export interface UpdateAlertThresholdRequest {
  highPercent: number;
  midPercent: number;
}

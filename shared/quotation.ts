export interface QuotationItemInput {
  model: string;
  color: string;
  quantity: number;
  logisticsType?: string;
  flexibleReserve?: number;
  flexibleIsRate?: boolean;
  customFees?: { feeName: string; feeAmount: number }[];
}

export interface QuotationCalculateRequest {
  customerShortName: string;
  isNewCustomer: boolean;
  country?: string;
  grade: string;
  creditCondition: string;
  channelType: string;
  region: string;
  categoryGrades?: Record<string, string>;
  items: QuotationItemInput[];
  /** 订单级全局物流/费用（兼容旧报价单与历史接口） */
  logisticsType?: string;
  flexibleReserve?: number;
  flexibleIsRate?: boolean;
  customFees?: { feeName: string; feeAmount: number }[];
}

export interface CalculatedQuotationItem {
  model: string;
  color: string;
  category: string;
  productGrade: string;
  purchaseCost: number;
  rdCost: number;
  moq: number;
  quantity: number;
  targetMargin: number;
  unitPrice: number;
  totalPrice: number;
  actualMargin: number;
  alertLevel: 'none' | 'yellow' | 'red';
  alertMsg: string;
  logisticsType?: string;
  logisticsCoefficient?: number;
  flexibleReserveAmount?: number;
  customFeesTotal?: number;
  customFees?: { feeName: string; feeAmount: number }[];
  baseCost?: number;
  benchmarkPrice?: number;
  kTotal?: number;
  discountedPrice?: number;
  priceWithChannelFee?: number;
  foreignCurrencyPrice?: number;
}

export interface QuotationCalculateResponse {
  gradeCoefficient: number;
  sensitivityCoefficient: number;
  creditCoefficient: number;
  insuranceCoefficient: number;
  logisticsCoefficient: number;
  exchangeRiskRate: number;
  afterSalesRate: number;
  marketingExpenseRate: number;
  quantityCoefficient: number;
  taxRate: number;
  items: CalculatedQuotationItem[];
  customFees: { feeName: string; feeAmount: number }[];
  customFeesTotal?: number;
  totalAmount: number;
  afterSalesSubtotal: number;
  marketingSubtotal: number;
}

export interface SaveQuotationRequest extends QuotationCalculateRequest {
  quotationNo?: string;
}

export interface QuotationListItem {
  id: string;
  quotationNo: string;
  customerShortName: string;
  customerFullName: string;
  totalAmount: number;
  status: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
}

export interface QuotationListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  keyword?: string;
}

export interface QuotationListResponse {
  items: QuotationListItem[];
  total: number;
}

export interface QuotationDetailResponse {
  id: string;
  quotationNo: string;
  customerShortName: string;
  customerFullName: string;
  country: string;
  region: string;
  channelType: string;
  isNewCustomer: boolean;
  grade: string;
  gradeCoefficient: number;
  sensitivityCoefficient: number;
  creditCondition: string;
  creditCoefficient: number;
  insuranceCoefficient: number;
  logisticsType: string;
  logisticsCoefficient: number;
  exchangeRiskRate: number;
  afterSalesRate: number;
  marketingExpenseRate: number;
  quantityCoefficient: number;
  flexibleReserve?: number;
  flexibleIsRate?: boolean;
  categoryGrades?: Record<string, string>;
  totalAmount: number;
  afterSalesSubtotal: number;
  marketingSubtotal: number;
  taxRate: number;
  status: string;
  rejectReason: string;
  createdByName: string;
  createdAt: string;
  items: CalculatedQuotationItem[];
  customFees: { feeName: string; feeAmount: number }[];
}

export * as CustomerLevelTypes from './customer-level';
export * as PriceSensitivityTypes from './price-sensitivity';
export * as CreditTermTypes from './credit-term';
export * as PurchaseQuantityTypes from './purchase-quantity';
export * as LogisticsCostTypes from './logistics-cost';
export * as OtherDiscountTypes from './other-discount';
export * as ProductTypes from './product';
export * as FileRecordTypes from './file-record';
export * as QuotationTypes from './quotation';
export * as UserAccountTypes from './user-account';

export interface DashboardStats {
  customerLevelCount: number;
  priceSensitivityCount: number;
  creditTermCount: number;
  purchaseQuantityCount: number;
  logisticsCostCount: number;
  otherDiscountCount: number;
}

export interface RecentUpdateItem {
  id: string;
  type: string;
  name: string;
  updatedAt: string;
  updatedBy: {
    userId: string;
    userName: string;
  };
}

export interface RecentUpdatesResponse {
  items: RecentUpdateItem[];
}

export interface CreateRoleRequest {
  bizID: string;
  name: string;
  description?: string;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
}

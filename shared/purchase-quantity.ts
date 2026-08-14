export interface PurchaseQuantityItem {
  id: string;
  typeDesc: string;
  discount: number;
  minMultiple: number;
  maxMultiple: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseQuantityListParams {
  page?: number;
  pageSize?: number;
}

export interface PurchaseQuantityListResponse {
  items: PurchaseQuantityItem[];
  total: number;
}

export interface CreatePurchaseQuantityRequest {
  typeDesc: string;
  discount: number;
  minMultiple?: number;
  maxMultiple?: number;
}

export interface UpdatePurchaseQuantityRequest {
  typeDesc: string;
  discount: number;
  minMultiple?: number;
  maxMultiple?: number;
}

export interface ImportPurchaseQuantityError {
  row: number;
  message: string;
}

export interface ImportPurchaseQuantityResponse {
  success: boolean;
  imported: number;
  updated: number;
  failed: number;
  errors: ImportPurchaseQuantityError[];
}

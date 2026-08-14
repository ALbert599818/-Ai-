export interface OtherDiscountItem {
  id: string;
  discountType: string;
  discount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OtherDiscountListParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface OtherDiscountListResponse {
  items: OtherDiscountItem[];
  total: number;
}

export interface CreateOtherDiscountRequest {
  discountType: string;
  discount: number;
}

export interface UpdateOtherDiscountRequest {
  discountType: string;
  discount: number;
}

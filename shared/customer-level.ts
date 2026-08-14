export interface CustomerLevelItem {
  id: string;
  name: string;
  discount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerLevelListParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface CustomerLevelListResponse {
  items: CustomerLevelItem[];
  total: number;
}

export interface CreateCustomerLevelRequest {
  name: string;
  discount: number;
}

export interface UpdateCustomerLevelRequest {
  name: string;
  discount: number;
}

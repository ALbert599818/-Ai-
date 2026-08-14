export interface AfterSalesReserveItem {
  id: string;
  customerShortName: string;
  rate: number;
  createdAt: string;
  updatedAt: string;
}

export interface AfterSalesReserveListParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface AfterSalesReserveListResponse {
  items: AfterSalesReserveItem[];
  total: number;
}

export interface CreateAfterSalesReserveRequest {
  customerShortName: string;
  rate: number;
}

export interface UpdateAfterSalesReserveRequest {
  customerShortName: string;
  rate: number;
}

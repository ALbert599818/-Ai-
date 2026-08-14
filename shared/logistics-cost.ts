export interface LogisticsCostItem {
  id: string;
  costType: string;
  discount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LogisticsCostListParams {
  page?: number;
  pageSize?: number;
}

export interface LogisticsCostListResponse {
  items: LogisticsCostItem[];
  total: number;
}

export interface CreateLogisticsCostRequest {
  costType: string;
  discount: number;
}

export interface UpdateLogisticsCostRequest {
  costType: string;
  discount: number;
}

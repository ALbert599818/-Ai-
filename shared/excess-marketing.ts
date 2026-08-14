export interface ExcessMarketingItem {
  id: string;
  customerShortName: string;
  rate: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExcessMarketingListParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface ExcessMarketingListResponse {
  items: ExcessMarketingItem[];
  total: number;
}

export interface CreateExcessMarketingRequest {
  customerShortName: string;
  rate: number;
}

export interface UpdateExcessMarketingRequest {
  customerShortName: string;
  rate: number;
}

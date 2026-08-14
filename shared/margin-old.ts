export interface MarginOldItem {
  id: string;
  customerShortName: string;
  model: string;
  targetMargin: number;
  createdAt: string;
  updatedAt: string;
}

export interface MarginOldListParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface MarginOldListResponse {
  items: MarginOldItem[];
  total: number;
}

export interface CreateMarginOldRequest {
  customerShortName: string;
  model: string;
  targetMargin: number;
}

export interface UpdateMarginOldRequest {
  customerShortName: string;
  model: string;
  targetMargin: number;
}

export interface ImportMarginOldItem {
  customerShortName: string;
  model: string;
  targetMargin: string;
}

export interface ImportMarginOldResponse {
  imported: number;
  updated: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}

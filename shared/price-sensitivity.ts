export interface PriceSensitivityItem {
  id: string;
  region: string;
  channelType: string;
  mode?: string;
  discount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PriceSensitivityListParams {
  region?: string;
  page?: number;
  pageSize?: number;
}

export interface PriceSensitivityListResponse {
  items: PriceSensitivityItem[];
  total: number;
}

export interface CreatePriceSensitivityRequest {
  region: string;
  channelType: string;
  discount: number;
}

export interface UpdatePriceSensitivityRequest {
  region: string;
  channelType: string;
  discount: number;
}

export interface ImportPriceSensitivityError {
  row: number;
  message: string;
}

export interface ImportPriceSensitivityResponse {
  success: boolean;
  imported: number;
  updated: number;
  failed: number;
  errors: ImportPriceSensitivityError[];
}

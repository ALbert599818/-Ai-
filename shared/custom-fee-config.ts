export interface CustomFeeConfigItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomFeeConfigListParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface CustomFeeConfigListResponse {
  items: CustomFeeConfigItem[];
  total: number;
}

export interface CreateCustomFeeConfigRequest {
  name: string;
}

export interface UpdateCustomFeeConfigRequest {
  name: string;
}

export interface ImportCustomFeeConfigError {
  row: number;
  message: string;
}

export interface ImportCustomFeeConfigResponse {
  success: boolean;
  imported: number;
  skipped: number;
  failed: number;
  errors: ImportCustomFeeConfigError[];
}

export interface ImportCustomFeeConfigItem {
  name: string;
}

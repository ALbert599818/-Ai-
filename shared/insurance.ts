export interface InsuranceItem {
  id: string;
  creditCondition: string;
  coefficient: number;
  createdAt: string;
  updatedAt: string;
}

export interface InsuranceListParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface InsuranceListResponse {
  items: InsuranceItem[];
  total: number;
}

export interface CreateInsuranceRequest {
  creditCondition: string;
  coefficient: number;
}

export interface UpdateInsuranceRequest {
  creditCondition: string;
  coefficient: number;
}

export interface ImportInsuranceError {
  row: number;
  message: string;
}

export interface ImportInsuranceResponse {
  success: boolean;
  imported: number;
  updated: number;
  failed: number;
  errors: ImportInsuranceError[];
}

export interface ProductGradeMarginItem {
  id: string;
  category: string;
  productGrade: string;
  targetMargin: string;
  marginRedline: string;
  salesRatio: string;
  marginContribution: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductGradeMarginListParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface ProductGradeMarginListResponse {
  items: ProductGradeMarginItem[];
  total: number;
}

export interface CreateProductGradeMarginRequest {
  category: string;
  productGrade: string;
  targetMargin: string;
  marginRedline: string;
  salesRatio: string;
  marginContribution: string;
}

export interface UpdateProductGradeMarginRequest {
  category: string;
  productGrade: string;
  targetMargin: string;
  marginRedline: string;
  salesRatio: string;
  marginContribution: string;
}

export interface ImportProductGradeMarginError {
  row: number;
  message: string;
}

export interface ImportProductGradeMarginResponse {
  success: boolean;
  imported: number;
  updated: number;
  failed: number;
  errors: ImportProductGradeMarginError[];
}

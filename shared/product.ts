export interface ProductItem {
  id: string;
  code?: string;
  model: string;
  series?: string;
  erpCategory?: string;
  category: string;
  color: string;
  productGrade: string;
  purchasePrice: string;
  purchaseCost?: string;
  rdCost: string;
  moq: number;
  isNewProduct: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface ProductListResponse {
  items: ProductItem[];
  total: number;
}

export interface CreateProductRequest {
  code?: string;
  model: string;
  series?: string;
  erpCategory?: string;
  category: string;
  color: string;
  productGrade: string;
  purchasePrice: string;
  purchaseCost?: string;
  rdCost: string;
  moq: number;
  isNewProduct?: boolean;
}

export interface UpdateProductRequest {
  model: string;
  color: string;
  purchasePrice: string;
  moq: number;
  category?: string;
  productGrade?: string;
  rdCost?: string;
  purchaseCost?: string;
  code?: string;
  series?: string;
  erpCategory?: string;
  isNewProduct?: boolean;
}

/** Excel 导入行原始数据（11 列物料基础数据） */
export interface ProductImportRow {
  code?: string;
  model: string;
  series?: string;
  erpCategory?: string;
  category?: string;
  isNewProduct?: string;
  color: string;
  productGrade?: string;
  purchaseCost?: string;
  rdCost?: string;
  moq: number | string;
}

export interface ImportProductError {
  row: number;
  message: string;
}

export interface ImportProductResponse {
  success: boolean;
  imported: number;
  failed: number;
  errors: ImportProductError[];
}

export interface ProductCategoryItem {
  id: string;
  name: string;
  defaultGrade: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategoryListResponse {
  items: ProductCategoryItem[];
}

export interface CreateProductCategoryRequest {
  name: string;
  defaultGrade?: string;
  sortOrder?: number;
}

export interface UpdateProductCategoryRequest {
  name?: string;
  defaultGrade?: string;
  sortOrder?: number;
}

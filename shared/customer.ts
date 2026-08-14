export interface CustomerItem {
  id: string;
  shortName: string;
  fullName: string;
  country: string;
  region: string;
  channelType: string;
  creditCondition: string;
  grade: string;
  customerCode: string;
  paymentTerm: string;
  salesChannel: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerListParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface CustomerListResponse {
  items: CustomerItem[];
  total: number;
}

export interface CreateCustomerRequest {
  shortName: string;
  fullName: string;
  country: string;
  region: string;
  channelType: string;
  creditCondition: string;
  grade: string;
  customerCode?: string;
  paymentTerm?: string;
  salesChannel?: string;
}

export interface UpdateCustomerRequest {
  shortName: string;
  fullName: string;
  country: string;
  region: string;
  channelType: string;
  creditCondition: string;
  grade: string;
  customerCode?: string;
  paymentTerm?: string;
  salesChannel?: string;
}

export interface CustomerCategoryGradeItem {
  id: string;
  customerId: string;
  category: string;
  grade: string;
}

export const PRODUCT_CATEGORIES = [
  '音频-耳机', '音频-音箱', 'PC-游戏耳机', 'PC-非耳机',
  '游戏品类', '移动', '投影仪', '手表', '小家电',
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

export const GRADE_OPTIONS = ['S', 'A', 'B', '无'] as const;
export type GradeOption = typeof GRADE_OPTIONS[number];

export interface BatchUpsertCategoryGradesRequest {
  grades: Record<string, string>;
}

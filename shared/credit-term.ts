export interface CreditTermItem {
  id: string;
  category: string;
  subItem: string;
  discount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreditTermListParams {
  category?: string;
  page?: number;
  pageSize?: number;
}

export interface CreditTermListResponse {
  items: CreditTermItem[];
  total: number;
}

export interface CreateCreditTermRequest {
  category: string;
  subItem: string;
  discount: number;
}

export interface UpdateCreditTermRequest {
  category: string;
  subItem: string;
  discount: number;
}

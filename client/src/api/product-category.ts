import { axiosForBackend } from '@/lib/lark-shim/http';
import { logger } from '@/lib/lark-shim/logger';
import { handleApiResponse } from '@client/src/utils/handleApiResponse';
import type {
  ProductCategoryItem,
  ProductCategoryListResponse,
  CreateProductCategoryRequest,
  UpdateProductCategoryRequest,
} from '@shared/product-category';

export async function getProductCategories() {
  try {
    const response = await axiosForBackend.get<ProductCategoryListResponse>('/api/product-categories');
    return handleApiResponse(response).items as ProductCategoryItem[];
  } catch (error) {
    logger.error('getProductCategories failed', error);
    throw error;
  }
}

export async function createProductCategory(data: CreateProductCategoryRequest) {
  try {
    const response = await axiosForBackend.post<{ id: string }>('/api/product-categories', data);
    return handleApiResponse(response);
  } catch (error) {
    logger.error('createProductCategory failed', error);
    throw error;
  }
}

export async function updateProductCategory(id: string, data: UpdateProductCategoryRequest) {
  try {
    const response = await axiosForBackend.put<{ success: boolean }>(`/api/product-categories/${id}`, data);
    return handleApiResponse(response);
  } catch (error) {
    logger.error('updateProductCategory failed', error);
    throw error;
  }
}

export async function deleteProductCategory(id: string) {
  try {
    const response = await axiosForBackend.delete<{ success: boolean }>(`/api/product-categories/${id}`);
    return handleApiResponse(response);
  } catch (error) {
    logger.error('deleteProductCategory failed', error);
    throw error;
  }
}

import { axiosForBackend } from '@/lib/lark-shim/http';
import { logger } from '@/lib/lark-shim/logger';
import { handleApiResponse } from '@client/src/utils/handleApiResponse';
import type {
  ProductListParams,
  ProductListResponse,
  CreateProductRequest,
  UpdateProductRequest,
  ImportProductResponse,
} from '@shared/product';

export async function getProductList(params?: ProductListParams) {
  try {
    const response = await axiosForBackend.get<ProductListResponse>('/api/products', { params });
    return handleApiResponse(response);
  } catch (error) {
    logger.error('getProductList failed', error);
    throw error;
  }
}

export async function createProduct(data: CreateProductRequest) {
  try {
    const response = await axiosForBackend.post<{ id: string }>('/api/products', data);
    return handleApiResponse(response);
  } catch (error) {
    logger.error('createProduct failed', error);
    throw error;
  }
}

export async function updateProduct(
  id: string,
  data: UpdateProductRequest,
) {
  try {
    const response = await axiosForBackend.put<{ success: boolean }>(`/api/products/${id}`, data);
    return handleApiResponse(response);
  } catch (error) {
    logger.error('updateProduct failed', error);
    throw error;
  }
}

export async function deleteProduct(id: string) {
  try {
    const response = await axiosForBackend.delete<{ success: boolean }>(`/api/products/${id}`);
    return handleApiResponse(response);
  } catch (error) {
    logger.error('deleteProduct failed', error);
    throw error;
  }
}

export async function importProducts(
  items: Array<{
    model: string;
    color: string;
    purchaseCost: string;
    moq: number;
    category?: string;
    productGrade?: string;
    rdCost?: string;
  }>,
) {
  try {
    const response = await axiosForBackend.post<ImportProductResponse>('/api/products/import', { items });
    return handleApiResponse(response);
  } catch (error) {
    logger.error('importProducts failed', error);
    throw error;
  }
}

export async function getProductCategories() {
  try {
    const response = await axiosForBackend.get<{ items: string[] }>('/api/products/categories');
    return handleApiResponse(response);
  } catch (error) {
    logger.error('getProductCategories failed', error);
    throw error;
  }
}

export async function batchUpdateProductGrade(category: string, productGrade: string) {
  try {
    const response = await axiosForBackend.post<{ updated: number }>('/api/products/batch-grade', {
      category,
      productGrade,
    });
    return handleApiResponse(response);
  } catch (error) {
    logger.error('batchUpdateProductGrade failed', error);
    throw error;
  }
}

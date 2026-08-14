import { axiosForBackend } from '@/lib/lark-shim/http';
import { logger } from '@/lib/lark-shim/logger';
import { handleApiResponse } from '@client/src/utils/handleApiResponse';
import type {
  ProductGradeMarginListParams,
  ProductGradeMarginListResponse,
  CreateProductGradeMarginRequest,
  UpdateProductGradeMarginRequest,
  ImportProductGradeMarginResponse,
} from '@shared/product-grade-margin';

export async function getProductGradeMarginList(
  params?: ProductGradeMarginListParams,
) {
  try {
    const response = await axiosForBackend.get<ProductGradeMarginListResponse>('/api/product-grade-margins', { params });
    return handleApiResponse(response);
  } catch (error) {
    logger.error(
      'getProductGradeMarginList failed',
      error,
    );
    throw error;
  }
}

export async function createProductGradeMargin(
  data: CreateProductGradeMarginRequest,
) {
  try {
    const response = await axiosForBackend.post<{ id: string }>('/api/product-grade-margins', data);
    return handleApiResponse(response);
  } catch (error) {
    logger.error(
      'createProductGradeMargin failed',
      error,
    );
    throw error;
  }
}

export async function updateProductGradeMargin(
  id: string,
  data: UpdateProductGradeMarginRequest,
) {
  try {
    const response = await axiosForBackend.put<{ success: boolean }>(`/api/product-grade-margins/${id}`, data);
    return handleApiResponse(response);
  } catch (error) {
    logger.error(
      'updateProductGradeMargin failed',
      error,
    );
    throw error;
  }
}

export async function deleteProductGradeMargin(
  id: string,
) {
  try {
    const response = await axiosForBackend.delete<{ success: boolean }>(`/api/product-grade-margins/${id}`);
    return handleApiResponse(response);
  } catch (error) {
    logger.error(
      'deleteProductGradeMargin failed',
      error,
    );
    throw error;
  }
}

export async function importProductGradeMargins(
  items: Array<{
    category: string;
    productGrade: string;
    targetMargin: string;
    marginRedline: string;
    salesRatio: string;
    marginContribution: string;
  }>,
) {
  try {
    const response = await axiosForBackend.post<ImportProductGradeMarginResponse>('/api/product-grade-margins/import', { items });
    return handleApiResponse(response);
  } catch (error) {
    logger.error(
      'importProductGradeMargins failed',
      error,
    );
    throw error;
  }
}

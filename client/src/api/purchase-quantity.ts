import { axiosForBackend } from '@/lib/lark-shim/http';
import { logger } from '@/lib/lark-shim/logger';
import { handleApiResponse } from '@client/src/utils/handleApiResponse';
import type {
  PurchaseQuantityListParams,
  PurchaseQuantityListResponse,
  CreatePurchaseQuantityRequest,
  UpdatePurchaseQuantityRequest,
  ImportPurchaseQuantityResponse,
} from '@shared/purchase-quantity';

export async function getPurchaseQuantityList(params?: PurchaseQuantityListParams) {
  try {
    const response = await axiosForBackend.get<PurchaseQuantityListResponse>(
      '/api/purchase-quantities',
      { params }
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('getPurchaseQuantityList failed', error);
    throw error;
  }
}

export async function createPurchaseQuantity(data: CreatePurchaseQuantityRequest) {
  try {
    const response = await axiosForBackend.post<{ id: string }>(
      '/api/purchase-quantities',
      data
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('createPurchaseQuantity failed', error);
    throw error;
  }
}

export async function updatePurchaseQuantity(id: string, data: UpdatePurchaseQuantityRequest) {
  try {
    const response = await axiosForBackend.put<{ success: boolean }>(
      `/api/purchase-quantities/${id}`,
      data
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('updatePurchaseQuantity failed', error);
    throw error;
  }
}

export async function importPurchaseQuantities(
  rows: Array<{ typeDesc: string; discount: string; minMultiple?: string; maxMultiple?: string }>,
) {
  try {
    const response = await axiosForBackend.post<ImportPurchaseQuantityResponse>(
      '/api/purchase-quantities/import',
      { rows }
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('importPurchaseQuantities failed', error);
    throw error;
  }
}

export async function deletePurchaseQuantity(id: string) {
  try {
    const response = await axiosForBackend.delete<{ success: boolean }>(
      `/api/purchase-quantities/${id}`
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('deletePurchaseQuantity failed', error);
    throw error;
  }
}

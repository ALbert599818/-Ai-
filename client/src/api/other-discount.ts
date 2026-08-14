import { axiosForBackend } from '@/lib/lark-shim/http';
import { logger } from '@/lib/lark-shim/logger';
import { handleApiResponse } from '@client/src/utils/handleApiResponse';
import type {
  OtherDiscountListParams,
  OtherDiscountListResponse,
  CreateOtherDiscountRequest,
  UpdateOtherDiscountRequest,
} from '@shared/other-discount';

export async function getOtherDiscountList(params?: OtherDiscountListParams) {
  try {
    const response = await axiosForBackend.get<OtherDiscountListResponse>(
      '/api/other-discounts',
      { params }
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('getOtherDiscountList failed', error);
    throw error;
  }
}

export async function createOtherDiscount(data: CreateOtherDiscountRequest) {
  try {
    const response = await axiosForBackend.post<{ id: string }>(
      '/api/other-discounts',
      data
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('createOtherDiscount failed', error);
    throw error;
  }
}

export async function updateOtherDiscount(id: string, data: UpdateOtherDiscountRequest) {
  try {
    const response = await axiosForBackend.put<{ success: boolean }>(
      `/api/other-discounts/${id}`,
      data
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('updateOtherDiscount failed', error);
    throw error;
  }
}

export async function deleteOtherDiscount(id: string) {
  try {
    const response = await axiosForBackend.delete<{ success: boolean }>(
      `/api/other-discounts/${id}`
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('deleteOtherDiscount failed', error);
    throw error;
  }
}

import { axiosForBackend } from '@/lib/lark-shim/http';
import { logger } from '@/lib/lark-shim/logger';
import { handleApiResponse } from '@client/src/utils/handleApiResponse';
import type {
  PriceSensitivityListParams,
  PriceSensitivityListResponse,
  CreatePriceSensitivityRequest,
  UpdatePriceSensitivityRequest,
  ImportPriceSensitivityResponse,
} from '@shared/price-sensitivity';

export async function getPriceSensitivityList(params?: PriceSensitivityListParams) {
  try {
    const response = await axiosForBackend.get<PriceSensitivityListResponse>(
      '/api/price-sensitivities',
      { params }
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('getPriceSensitivityList failed', error);
    throw error;
  }
}

export async function createPriceSensitivity(data: CreatePriceSensitivityRequest) {
  try {
    const response = await axiosForBackend.post<{ id: string }>(
      '/api/price-sensitivities',
      data
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('createPriceSensitivity failed', error);
    throw error;
  }
}

export async function updatePriceSensitivity(id: string, data: UpdatePriceSensitivityRequest) {
  try {
    const response = await axiosForBackend.put<{ success: boolean }>(
      `/api/price-sensitivities/${id}`,
      data
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('updatePriceSensitivity failed', error);
    throw error;
  }
}

export async function deletePriceSensitivity(id: string) {
  try {
    const response = await axiosForBackend.delete<{ success: boolean }>(
      `/api/price-sensitivities/${id}`
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('deletePriceSensitivity failed', error);
    throw error;
  }
}

export async function importPriceSensitivities(
  items: Array<{ region: string; channelType: string; discount: string }>,
) {
  try {
    const response = await axiosForBackend.post<ImportPriceSensitivityResponse>(
      '/api/price-sensitivities/import',
      { items },
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('importPriceSensitivities failed', error);
    throw error;
  }
}

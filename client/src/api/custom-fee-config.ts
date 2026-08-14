import { axiosForBackend } from '@/lib/lark-shim/http';
import { logger } from '@/lib/lark-shim/logger';
import { handleApiResponse } from '@client/src/utils/handleApiResponse';
import type {
  CustomFeeConfigListParams,
  CustomFeeConfigListResponse,
  CreateCustomFeeConfigRequest,
  UpdateCustomFeeConfigRequest,
  ImportCustomFeeConfigItem,
  ImportCustomFeeConfigResponse,
} from '@shared/custom-fee-config';

export async function getCustomFeeConfigList(
  params?: CustomFeeConfigListParams,
) {
  try {
    const response = await axiosForBackend.get<CustomFeeConfigListResponse>('/api/custom-fee-configs', { params });
    return handleApiResponse(response);
  } catch (error) {
    logger.error('getCustomFeeConfigList failed', error);
    throw error;
  }
}

export async function createCustomFeeConfig(
  data: CreateCustomFeeConfigRequest,
) {
  try {
    const response = await axiosForBackend.post<{ id: string }>('/api/custom-fee-configs', data);
    return handleApiResponse(response);
  } catch (error) {
    logger.error('createCustomFeeConfig failed', error);
    throw error;
  }
}

export async function updateCustomFeeConfig(
  id: string,
  data: UpdateCustomFeeConfigRequest,
) {
  try {
    const response = await axiosForBackend.put<{ success: boolean }>(`/api/custom-fee-configs/${id}`, data);
    return handleApiResponse(response);
  } catch (error) {
    logger.error('updateCustomFeeConfig failed', error);
    throw error;
  }
}

export async function importCustomFeeConfigs(
  items: ImportCustomFeeConfigItem[],
) {
  try {
    const response = await axiosForBackend.post<ImportCustomFeeConfigResponse>(
      '/api/custom-fee-configs/import',
      { items },
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('importCustomFeeConfigs failed', error);
    throw error;
  }
}

export async function deleteCustomFeeConfig(id: string) {
  try {
    const response = await axiosForBackend.delete<{ success: boolean }>(`/api/custom-fee-configs/${id}`);
    return handleApiResponse(response);
  } catch (error) {
    logger.error('deleteCustomFeeConfig failed', error);
    throw error;
  }
}

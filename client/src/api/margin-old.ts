import { axiosForBackend } from '@/lib/lark-shim/http';
import { logger } from '@/lib/lark-shim/logger';
import { handleApiResponse } from '@client/src/utils/handleApiResponse';
import type {
  MarginOldListParams,
  MarginOldListResponse,
  CreateMarginOldRequest,
  UpdateMarginOldRequest,
  ImportMarginOldItem,
  ImportMarginOldResponse,
} from '@shared/margin-old';

export async function getMarginOldList(params?: MarginOldListParams) {
  try {
    const response = await axiosForBackend.get<MarginOldListResponse>('/api/margins/old', { params });
    return handleApiResponse(response);
  } catch (error) {
    logger.error('getMarginOldList failed', error);
    throw error;
  }
}

export async function createMarginOld(data: CreateMarginOldRequest) {
  try {
    const response = await axiosForBackend.post<{ id: string }>('/api/margins/old', data);
    return handleApiResponse(response);
  } catch (error) {
    logger.error('createMarginOld failed', error);
    throw error;
  }
}

export async function updateMarginOld(
  id: string,
  data: UpdateMarginOldRequest,
) {
  try {
    const response = await axiosForBackend.put<{ success: boolean }>(`/api/margins/old/${id}`, data);
    return handleApiResponse(response);
  } catch (error) {
    logger.error('updateMarginOld failed', error);
    throw error;
  }
}

export async function deleteMarginOld(id: string) {
  try {
    const response = await axiosForBackend.delete<{ success: boolean }>(`/api/margins/old/${id}`);
    return handleApiResponse(response);
  } catch (error) {
    logger.error('deleteMarginOld failed', error);
    throw error;
  }
}

export async function importMarginOlds(
  items: ImportMarginOldItem[],
): Promise<ImportMarginOldResponse> {
  try {
    const response = await axiosForBackend.post('/api/margins/old/import', { items });
    return handleApiResponse(response);
  } catch (error) {
    logger.error('importMarginOlds failed', error);
    throw error;
  }
}

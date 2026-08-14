import { axiosForBackend } from '@/lib/lark-shim/http';
import { logger } from '@/lib/lark-shim/logger';
import { handleApiResponse } from '@client/src/utils/handleApiResponse';
import type {
  ExcessMarketingListParams,
  ExcessMarketingListResponse,
  CreateExcessMarketingRequest,
  UpdateExcessMarketingRequest,
} from '@shared/excess-marketing';

export async function getExcessMarketingList(
  params?: ExcessMarketingListParams,
) {
  try {
    const response = await axiosForBackend.get<ExcessMarketingListResponse>('/api/excess-marketing', { params });
    return handleApiResponse(response);
  } catch (error) {
    logger.error('getExcessMarketingList failed', error);
    throw error;
  }
}

export async function createExcessMarketing(
  data: CreateExcessMarketingRequest,
) {
  try {
    const response = await axiosForBackend.post<{ id: string }>(
      '/api/excess-marketing',
      data,
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('createExcessMarketing failed', error);
    throw error;
  }
}

export async function updateExcessMarketing(
  id: string,
  data: UpdateExcessMarketingRequest,
) {
  try {
    const response = await axiosForBackend.put<{ success: boolean }>(
      `/api/excess-marketing/${id}`,
      data,
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('updateExcessMarketing failed', error);
    throw error;
  }
}

export async function deleteExcessMarketing(id: string) {
  try {
    const response = await axiosForBackend.delete<{ success: boolean }>(`/api/excess-marketing/${id}`);
    return handleApiResponse(response);
  } catch (error) {
    logger.error('deleteExcessMarketing failed', error);
    throw error;
  }
}

import { axiosForBackend } from '@/lib/lark-shim/http';
import { logger } from '@/lib/lark-shim/logger';
import { handleApiResponse } from '@client/src/utils/handleApiResponse';
import type {
  LogisticsCostListParams,
  LogisticsCostListResponse,
  CreateLogisticsCostRequest,
  UpdateLogisticsCostRequest,
} from '@shared/logistics-cost';

export async function getLogisticsCostList(params?: LogisticsCostListParams) {
  try {
    const response = await axiosForBackend.get<LogisticsCostListResponse>(
      '/api/logistics-costs',
      { params }
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('getLogisticsCostList failed', error);
    throw error;
  }
}

export async function createLogisticsCost(data: CreateLogisticsCostRequest) {
  try {
    const response = await axiosForBackend.post<{ id: string }>(
      '/api/logistics-costs',
      data
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('createLogisticsCost failed', error);
    throw error;
  }
}

export async function updateLogisticsCost(id: string, data: UpdateLogisticsCostRequest) {
  try {
    const response = await axiosForBackend.put<{ success: boolean }>(
      `/api/logistics-costs/${id}`,
      data
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('updateLogisticsCost failed', error);
    throw error;
  }
}

export async function deleteLogisticsCost(id: string) {
  try {
    const response = await axiosForBackend.delete<{ success: boolean }>(
      `/api/logistics-costs/${id}`
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('deleteLogisticsCost failed', error);
    throw error;
  }
}

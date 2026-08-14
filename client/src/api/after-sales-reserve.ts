import { axiosForBackend } from '@/lib/lark-shim/http';
import { logger } from '@/lib/lark-shim/logger';
import { handleApiResponse } from '@client/src/utils/handleApiResponse';
import type {
  AfterSalesReserveListParams,
  AfterSalesReserveListResponse,
  CreateAfterSalesReserveRequest,
  UpdateAfterSalesReserveRequest,
} from '@shared/after-sales-reserve';

export async function getAfterSalesReserveList(
  params?: AfterSalesReserveListParams,
) {
  try {
    const response = await axiosForBackend.get<AfterSalesReserveListResponse>('/api/after-sales-reserves', { params });
    return handleApiResponse(response);
  } catch (error) {
    logger.error('getAfterSalesReserveList failed', error);
    throw error;
  }
}

export async function createAfterSalesReserve(
  data: CreateAfterSalesReserveRequest,
) {
  try {
    const response = await axiosForBackend.post<{ id: string }>(
      '/api/after-sales-reserves',
      data,
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('createAfterSalesReserve failed', error);
    throw error;
  }
}

export async function updateAfterSalesReserve(
  id: string,
  data: UpdateAfterSalesReserveRequest,
) {
  try {
    const response = await axiosForBackend.put<{ success: boolean }>(
      `/api/after-sales-reserves/${id}`,
      data,
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('updateAfterSalesReserve failed', error);
    throw error;
  }
}

export async function deleteAfterSalesReserve(id: string) {
  try {
    const response = await axiosForBackend.delete<{ success: boolean }>(`/api/after-sales-reserves/${id}`);
    return handleApiResponse(response);
  } catch (error) {
    logger.error('deleteAfterSalesReserve failed', error);
    throw error;
  }
}

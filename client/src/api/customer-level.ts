import { axiosForBackend } from '@/lib/lark-shim/http';
import { logger } from '@/lib/lark-shim/logger';
import { handleApiResponse } from '@client/src/utils/handleApiResponse';
import type {
  CustomerLevelListParams,
  CustomerLevelListResponse,
  CreateCustomerLevelRequest,
  UpdateCustomerLevelRequest,
} from '@shared/customer-level';

export async function getCustomerLevelList(params?: CustomerLevelListParams) {
  try {
    const response = await axiosForBackend.get<CustomerLevelListResponse>(
      '/api/customer-levels',
      { params }
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('getCustomerLevelList failed', error);
    throw error;
  }
}

export async function createCustomerLevel(data: CreateCustomerLevelRequest) {
  try {
    const response = await axiosForBackend.post<{ id: string }>(
      '/api/customer-levels',
      data
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('createCustomerLevel failed', error);
    throw error;
  }
}

export async function updateCustomerLevel(id: string, data: UpdateCustomerLevelRequest) {
  try {
    const response = await axiosForBackend.put<{ success: boolean }>(
      `/api/customer-levels/${id}`,
      data
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('updateCustomerLevel failed', error);
    throw error;
  }
}

export async function deleteCustomerLevel(id: string) {
  try {
    const response = await axiosForBackend.delete<{ success: boolean }>(
      `/api/customer-levels/${id}`
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('deleteCustomerLevel failed', error);
    throw error;
  }
}

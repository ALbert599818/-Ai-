import { axiosForBackend } from '@/lib/lark-shim/http';
import { logger } from '@/lib/lark-shim/logger';
import { handleApiResponse } from '@client/src/utils/handleApiResponse';
import type {
  CreditTermListParams,
  CreditTermListResponse,
  CreateCreditTermRequest,
  UpdateCreditTermRequest,
} from '@shared/credit-term';

export async function getCreditTermList(params?: CreditTermListParams) {
  try {
    const response = await axiosForBackend.get<CreditTermListResponse>(
      '/api/credit-terms',
      { params }
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('getCreditTermList failed', error);
    throw error;
  }
}

export async function createCreditTerm(data: CreateCreditTermRequest) {
  try {
    const response = await axiosForBackend.post<{ id: string }>(
      '/api/credit-terms',
      data
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('createCreditTerm failed', error);
    throw error;
  }
}

export async function updateCreditTerm(id: string, data: UpdateCreditTermRequest) {
  try {
    const response = await axiosForBackend.put<{ success: boolean }>(
      `/api/credit-terms/${id}`,
      data
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('updateCreditTerm failed', error);
    throw error;
  }
}

export async function deleteCreditTerm(id: string) {
  try {
    const response = await axiosForBackend.delete<{ success: boolean }>(
      `/api/credit-terms/${id}`
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('deleteCreditTerm failed', error);
    throw error;
  }
}

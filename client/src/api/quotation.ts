import { axiosForBackend } from '@/lib/lark-shim/http';
import { logger } from '@/lib/lark-shim/logger';
import { handleApiResponse } from '@client/src/utils/handleApiResponse';
import type {
  QuotationCalculateRequest,
  QuotationCalculateResponse,
  SaveQuotationRequest,
  QuotationListParams,
  QuotationListResponse,
  QuotationDetailResponse,
} from '@shared/quotation';

export async function calculateQuotation(
  data: QuotationCalculateRequest,
): Promise<QuotationCalculateResponse> {
  try {
    const response = await axiosForBackend.post(
      '/api/quotations/calculate',
      data,
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('calculateQuotation failed', error);
    throw error;
  }
}

export async function saveQuotation(
  data: SaveQuotationRequest,
): Promise<{ id: string; quotationNo: string }> {
  try {
    const response = await axiosForBackend.post(
      '/api/quotations',
      data,
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('saveQuotation failed', error);
    throw error;
  }
}

export async function getQuotationList(
  params?: QuotationListParams,
): Promise<QuotationListResponse> {
  try {
    const response = await axiosForBackend.get('/api/quotations', {
      params,
    });
    return handleApiResponse(response);
  } catch (error) {
    logger.error('getQuotationList failed', error);
    throw error;
  }
}

export async function getQuotationDetail(
  id: string,
): Promise<QuotationDetailResponse> {
  try {
    const response = await axiosForBackend.get(
      `/api/quotations/${id}`,
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('getQuotationDetail failed', error);
    throw error;
  }
}

export async function deleteQuotation(
  id: string,
): Promise<{ success: boolean }> {
  try {
    const response = await axiosForBackend.delete(
      `/api/quotations/${id}`,
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('deleteQuotation failed', error);
    throw error;
  }
}

export async function submitQuotation(
  id: string,
): Promise<{ success: boolean }> {
  try {
    const response = await axiosForBackend.put(
      `/api/quotations/${id}/submit`,
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('submitQuotation failed', error);
    throw error;
  }
}

export async function approveQuotation(
  id: string,
): Promise<{ success: boolean }> {
  try {
    const response = await axiosForBackend.put(
      `/api/quotations/${id}/approve`,
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('approveQuotation failed', error);
    throw error;
  }
}

export async function resubmitQuotation(
  id: string,
): Promise<{ success: boolean }> {
  try {
    const response = await axiosForBackend.put(
      `/api/quotations/${id}/resubmit`,
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('resubmitQuotation failed', error);
    throw error;
  }
}

export async function rejectQuotation(
  id: string,
  reason: string,
): Promise<{ success: boolean }> {
  try {
    const response = await axiosForBackend.put(
      `/api/quotations/${id}/reject`,
      { reason },
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('rejectQuotation failed', error);
    throw error;
  }
}

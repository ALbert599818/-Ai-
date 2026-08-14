import { axiosForBackend } from '@/lib/lark-shim/http';
import { logger } from '@/lib/lark-shim/logger';
import { handleApiResponse } from '@client/src/utils/handleApiResponse';
import type {
  QuotationListParams,
  QuotationListResponse,
} from '@shared/quotation';

export interface MyQuotationItem {
  id: string;
  quotationNo: string;
  customerShortName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface MyQuotationListResponse {
  items: MyQuotationItem[];
  total: number;
}

export async function getMyQuotations(
  params?: QuotationListParams,
) {
  try {
    const r = await axiosForBackend.get<QuotationListResponse>('/api/my/quotations', { params });
    return handleApiResponse(r);
  } catch (error) {
    logger.error('getMyQuotations failed', error);
    throw error;
  }
}

export async function getMyStatusCounts() {
  try {
    const r = await axiosForBackend.get<Record<string, number>>('/api/my/counts');
    return handleApiResponse(r);
  } catch (error) {
    logger.error('getMyStatusCounts failed', error);
    throw error;
  }
}

export async function getMyPendingQuotations(): Promise<MyQuotationListResponse> {
  try {
    const r = await axiosForBackend.get<MyQuotationListResponse>('/api/my/pending');
    return handleApiResponse(r);
  } catch (error) {
    logger.error('getMyPendingQuotations failed', error);
    throw error;
  }
}

export async function getMyCompletedQuotations(): Promise<MyQuotationListResponse> {
  try {
    const r = await axiosForBackend.get<MyQuotationListResponse>('/api/my/completed');
    return handleApiResponse(r);
  } catch (error) {
    logger.error('getMyCompletedQuotations failed', error);
    throw error;
  }
}

export async function getMyDraftQuotations(): Promise<MyQuotationListResponse> {
  try {
    const r = await axiosForBackend.get<MyQuotationListResponse>('/api/my/drafts');
    return handleApiResponse(r);
  } catch (error) {
    logger.error('getMyDraftQuotations failed', error);
    throw error;
  }
}

export async function getMyDrafts() {
  return getMyQuotations({ status: 'draft' });
}

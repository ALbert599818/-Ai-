import { axiosForBackend } from '@/lib/lark-shim/http';
import { logger } from '@/lib/lark-shim/logger';
import { handleApiResponse } from '@client/src/utils/handleApiResponse';
import type {
  CustomerListParams,
  CustomerListResponse,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerCategoryGradeItem,
  BatchUpsertCategoryGradesRequest,
} from '@shared/customer';

export async function getCustomerList(params?: CustomerListParams) {
  try {
    const response = await axiosForBackend.get<CustomerListResponse>(
      '/api/customers',
      { params }
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('getCustomerList failed', error);
    throw error;
  }
}

export async function searchCustomers(q: string) {
  try {
    const response = await axiosForBackend.get<{ id: string; shortName: string }[]>(
      '/api/customers/search',
      { params: { q } }
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('searchCustomers failed', error);
    throw error;
  }
}

export async function createCustomer(data: CreateCustomerRequest) {
  try {
    const response = await axiosForBackend.post<{ id: string }>(
      '/api/customers',
      data
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('createCustomer failed', error);
    throw error;
  }
}

export async function updateCustomer(id: string, data: UpdateCustomerRequest) {
  try {
    const response = await axiosForBackend.put<{ success: boolean }>(
      `/api/customers/${id}`,
      data
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('updateCustomer failed', error);
    throw error;
  }
}

export async function deleteCustomer(id: string) {
  try {
    const response = await axiosForBackend.delete<{ success: boolean }>(
      `/api/customers/${id}`
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('deleteCustomer failed', error);
    throw error;
  }
}

export async function getCustomerCategoryGrades(
  customerId: string,
): Promise<CustomerCategoryGradeItem[]> {
  try {
    const response = await axiosForBackend.get<CustomerCategoryGradeItem[]>(
      `/api/customers/${customerId}/category-grades`,
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('getCustomerCategoryGrades failed', error);
    throw error;
  }
}

export async function updateCustomerCategoryGrades(
  customerId: string,
  grades: Record<string, string>,
): Promise<void> {
  try {
    const body: BatchUpsertCategoryGradesRequest = { grades };
    const response = await axiosForBackend.put<void>(
      `/api/customers/${customerId}/category-grades`,
      body,
    );
    handleApiResponse(response);
  } catch (error) {
    logger.error('updateCustomerCategoryGrades failed', error);
    throw error;
  }
}

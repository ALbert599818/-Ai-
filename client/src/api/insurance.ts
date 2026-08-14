import { axiosForBackend } from '@/lib/lark-shim/http';
import { logger } from '@/lib/lark-shim/logger';
import { handleApiResponse } from '@client/src/utils/handleApiResponse';
import type {
  InsuranceListParams,
  InsuranceListResponse,
  CreateInsuranceRequest,
  UpdateInsuranceRequest,
  ImportInsuranceResponse,
} from '@shared/insurance';

export async function getInsuranceList(params?: InsuranceListParams) {
  try {
    const response = await axiosForBackend.get<InsuranceListResponse>(
      '/api/insurance-coefficients',
      { params },
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('getInsuranceList failed', error);
    throw error;
  }
}

export async function createInsurance(data: CreateInsuranceRequest) {
  try {
    const response = await axiosForBackend.post<{ id: string }>(
      '/api/insurance-coefficients',
      data,
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('createInsurance failed', error);
    throw error;
  }
}

export async function updateInsurance(
  id: string,
  data: UpdateInsuranceRequest,
) {
  try {
    const response = await axiosForBackend.put<{ success: boolean }>(
      `/api/insurance-coefficients/${id}`,
      data,
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('updateInsurance failed', error);
    throw error;
  }
}

export async function deleteInsurance(id: string) {
  try {
    const response = await axiosForBackend.delete<{ success: boolean }>(
      `/api/insurance-coefficients/${id}`,
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('deleteInsurance failed', error);
    throw error;
  }
}

export async function importInsuranceCoefficient(
  items: Array<{ creditCondition: string; coefficient: string }>,
): Promise<ImportInsuranceResponse> {
  try {
    const response = await axiosForBackend.post<ImportInsuranceResponse>(
      '/api/insurance-coefficients/import',
      { items },
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('importInsuranceCoefficient failed', error);
    throw error;
  }
}

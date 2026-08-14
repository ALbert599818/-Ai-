import { axiosForBackend } from '@/lib/lark-shim/http';
import { logger } from '@/lib/lark-shim/logger';
import { handleApiResponse } from '@client/src/utils/handleApiResponse';
import type {
  ExchangeRiskRateData,
  TaxRateData,
  AlertThresholdData,
  UpdateExchangeRiskRateRequest,
  UpdateTaxRateRequest,
  UpdateAlertThresholdRequest,
} from '@shared/global-config';

export async function getExchangeRiskRate() {
  try {
    const response = await axiosForBackend.get<ExchangeRiskRateData>('/api/global-config/exchange-risk');
    return handleApiResponse(response);
  } catch (error) {
    logger.error('getExchangeRiskRate failed', error);
    throw error;
  }
}

export async function updateExchangeRiskRate(
  data: UpdateExchangeRiskRateRequest,
) {
  try {
    const response = await axiosForBackend.put<ExchangeRiskRateData>('/api/global-config/exchange-risk', data);
    return handleApiResponse(response);
  } catch (error) {
    logger.error('updateExchangeRiskRate failed', error);
    throw error;
  }
}

export async function getTaxRate() {
  try {
    const response = await axiosForBackend.get<TaxRateData>('/api/global-config/tax-rate');
    return handleApiResponse(response);
  } catch (error) {
    logger.error('getTaxRate failed', error);
    throw error;
  }
}

export async function updateTaxRate(
  data: UpdateTaxRateRequest,
) {
  try {
    const response = await axiosForBackend.put<TaxRateData>('/api/global-config/tax-rate', data);
    return handleApiResponse(response);
  } catch (error) {
    logger.error('updateTaxRate failed', error);
    throw error;
  }
}

export async function getAlertThreshold() {
  try {
    const response = await axiosForBackend.get<AlertThresholdData>('/api/global-config/alert-threshold');
    return handleApiResponse(response);
  } catch (error) {
    logger.error('getAlertThreshold failed', error);
    throw error;
  }
}

export async function updateAlertThreshold(
  data: UpdateAlertThresholdRequest,
) {
  try {
    const response = await axiosForBackend.put<AlertThresholdData>('/api/global-config/alert-threshold', data);
    return handleApiResponse(response);
  } catch (error) {
    logger.error('updateAlertThreshold failed', error);
    throw error;
  }
}

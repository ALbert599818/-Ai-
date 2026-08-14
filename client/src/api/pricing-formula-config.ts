import { axiosForBackend } from '@/lib/lark-shim/http';
import type {
  PricingFormulaConfigResponse,
  UpdatePricingFormulaConfigRequest,
} from '@shared/pricing-formula-config';

export async function getPricingFormulaConfig(): Promise<PricingFormulaConfigResponse> {
  const res = await axiosForBackend.get('/api/pricing-formula-config');
  return res.data.data;
}

export async function updatePricingFormulaConfig(
  configValue: UpdatePricingFormulaConfigRequest['configValue'],
): Promise<PricingFormulaConfigResponse> {
  const res = await axiosForBackend.patch(
    '/api/pricing-formula-config',
    { configValue },
  );
  return res.data.data;
}

export async function resetPricingFormulaConfig(): Promise<PricingFormulaConfigResponse> {
  const res = await axiosForBackend.post(
    '/api/pricing-formula-config/reset',
  );
  return res.data.data;
}

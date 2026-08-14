import { axiosForBackend } from '@/lib/lark-shim/http';
import { logger } from '@/lib/lark-shim/logger';
import { handleApiResponse } from '@client/src/utils/handleApiResponse';

export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

async function uploadFile(
  type: string,
  file: File,
): Promise<ImportResult> {
  const reader = new FileReader();
  const base64 = await new Promise<string>((resolve, reject) => {
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  try {
    const response = await axiosForBackend.post<ImportResult>(
      `/api/data-import/${type}`,
      { file: base64 },
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error(`uploadFile ${type} failed`, error);
    throw error;
  }
}

export async function importCustomers(
  file: File,
): Promise<ImportResult> {
  return uploadFile('customers', file);
}

export async function importAfterSalesReserve(
  file: File,
): Promise<ImportResult> {
  return uploadFile('after-sales-reserve', file);
}

export async function importExcessMarketing(
  file: File,
): Promise<ImportResult> {
  return uploadFile('excess-marketing', file);
}

export async function importGrossMarginNew(
  file: File,
): Promise<ImportResult> {
  return uploadFile('gross-margin-new', file);
}

export async function clearData(
  type: string,
): Promise<{ deleted: number }> {
  try {
    const response = await axiosForBackend.delete<{ deleted: number }>(
      `/api/data-import/clear/${type}`,
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error(`clearData ${type} failed`, error);
    throw error;
  }
}

export interface SeedResult {
  seededTables: string[];
  skippedTables: string[];
}

export async function seedDemoData(): Promise<SeedResult> {
  try {
    const response = await axiosForBackend.post<SeedResult>(
      '/api/data-import/seed',
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('seedDemoData failed', error);
    throw error;
  }
}

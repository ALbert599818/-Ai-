import { axiosForBackend } from '@/lib/lark-shim/http';
import { logger } from '@/lib/lark-shim/logger';
import { handleApiResponse } from '@client/src/utils/handleApiResponse';
import type {
  FileRecordListParams,
  FileRecordListResponse,
  BatchCreateFileRecordRequest,
  BatchCreateFileRecordResponse,
} from '@shared/file-record';

export async function getFileRecordList(params?: FileRecordListParams) {
  try {
    const response = await axiosForBackend.get<FileRecordListResponse>(
      '/api/file-records',
      { params }
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('getFileRecordList failed', error);
    throw error;
  }
}

export async function batchCreateFileRecords(data: BatchCreateFileRecordRequest) {
  try {
    const response = await axiosForBackend.post<BatchCreateFileRecordResponse>(
      '/api/file-records/batch',
      data
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('batchCreateFileRecords failed', error);
    throw error;
  }
}

export async function deleteFileRecord(id: string) {
  try {
    const response = await axiosForBackend.delete<{ success: boolean; filePath: string }>(
      `/api/file-records/${id}`
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('deleteFileRecord failed', error);
    throw error;
  }
}

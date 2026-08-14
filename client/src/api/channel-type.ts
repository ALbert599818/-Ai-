import { axiosForBackend } from '@/lib/lark-shim/http';
import { logger } from '@/lib/lark-shim/logger';
import { handleApiResponse } from '@client/src/utils/handleApiResponse';
import type {
  ChannelTypeListParams,
  ChannelTypeListResponse,
  CreateChannelTypeRequest,
  UpdateChannelTypeRequest,
} from '@shared/channel-type';

export async function getChannelTypeList(params?: ChannelTypeListParams) {
  try {
    const response = await axiosForBackend.get<ChannelTypeListResponse>(
      '/api/channel-types',
      { params }
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('getChannelTypeList failed', error);
    throw error;
  }
}

export async function createChannelType(data: CreateChannelTypeRequest) {
  try {
    const response = await axiosForBackend.post<{ id: string }>(
      '/api/channel-types',
      data
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('createChannelType failed', error);
    throw error;
  }
}

export async function updateChannelType(id: string, data: UpdateChannelTypeRequest) {
  try {
    const response = await axiosForBackend.put<{ success: boolean }>(
      `/api/channel-types/${id}`,
      data
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('updateChannelType failed', error);
    throw error;
  }
}

export async function deleteChannelType(id: string) {
  try {
    const response = await axiosForBackend.delete<{ success: boolean }>(
      `/api/channel-types/${id}`
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('deleteChannelType failed', error);
    throw error;
  }
}

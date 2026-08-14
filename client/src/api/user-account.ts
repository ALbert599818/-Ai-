import { axiosForBackend } from '@/lib/lark-shim/http';
import { logger } from '@/lib/lark-shim/logger';
import { handleApiResponse } from '@client/src/utils/handleApiResponse';
import type { AxiosResponse } from 'axios';
import type {
  UserAccountInfo,
  UserAccountDetail,
  UserAccountListResponse,
  UpdateMyAccountRequest,
  ChangePasswordRequest,
  AdminUpdateUserRequest,
  UserAccountListParams,
  CreateTestAccountRequest,
} from '@shared/user-account';

export type {
  UserAccountInfo,
  UserAccountDetail,
  UserAccountListResponse,
  UpdateMyAccountRequest,
  ChangePasswordRequest,
  AdminUpdateUserRequest,
  UserAccountListParams,
  CreateTestAccountRequest,
};

export async function getMyAccount(): Promise<UserAccountInfo> {
  try {
    const response: AxiosResponse<UserAccountInfo> =
      await axiosForBackend.get('/api/user-account/me');
    return handleApiResponse(response);
  } catch (error) {
    logger.error('getMyAccount failed', error);
    throw error;
  }
}

export async function updateMyAccount(
  data: UpdateMyAccountRequest,
): Promise<UserAccountInfo> {
  try {
    const response: AxiosResponse<UserAccountInfo> =
      await axiosForBackend.put('/api/user-account/me', data);
    return handleApiResponse(response);
  } catch (error) {
    logger.error('updateMyAccount failed', error);
    throw error;
  }
}

export async function changePassword(
  data: ChangePasswordRequest,
): Promise<{ success: boolean }> {
  try {
    const response: AxiosResponse<{ success: boolean }> =
      await axiosForBackend.put('/api/user-account/me/password', data);
    return handleApiResponse(response);
  } catch (error) {
    logger.error('changePassword failed', error);
    throw error;
  }
}

export async function listUsers(
  params?: UserAccountListParams,
): Promise<UserAccountListResponse> {
  try {
    const response: AxiosResponse<UserAccountListResponse> =
      await axiosForBackend.get('/api/user-account/list', { params });
    return handleApiResponse(response);
  } catch (error) {
    logger.error('listUsers failed', error);
    throw error;
  }
}

export async function getUserDetail(
  userId: string,
): Promise<UserAccountDetail> {
  try {
    const response: AxiosResponse<UserAccountDetail> =
      await axiosForBackend.get(`/api/user-account/${userId}`);
    return handleApiResponse(response);
  } catch (error) {
    logger.error('getUserDetail failed', error);
    throw error;
  }
}

export async function adminUpdateUser(
  userId: string,
  data: AdminUpdateUserRequest,
): Promise<{ success: boolean }> {
  try {
    const response: AxiosResponse<{ success: boolean }> =
      await axiosForBackend.put(`/api/user-account/${userId}`, data);
    return handleApiResponse(response);
  } catch (error) {
    logger.error('adminUpdateUser failed', error);
    throw error;
  }
}

export async function createTestAccount(
  data: CreateTestAccountRequest,
): Promise<UserAccountInfo> {
  try {
    const response: AxiosResponse<UserAccountInfo> =
      await axiosForBackend.post('/api/user-account/create-test', data);
    return handleApiResponse(response);
  } catch (error) {
    logger.error('createTestAccount failed', error);
    throw error;
  }
}

export async function ensureAccount(
  userId: string,
  displayName?: string,
  email?: string,
): Promise<UserAccountInfo> {
  try {
    const response: AxiosResponse<UserAccountInfo> =
      await axiosForBackend.post('/api/user-account/ensure', {
        userId,
        displayName,
        email,
      });
    return handleApiResponse(response);
  } catch (error) {
    logger.error('ensureAccount failed', error);
    throw error;
  }
}

export async function deleteUser(userId: string): Promise<{ success: boolean }> {
  try {
    const response: AxiosResponse<{ success: boolean }> =
      await axiosForBackend.delete(`/api/user-account/${userId}`);
    return handleApiResponse(response);
  } catch (error) {
    logger.error('deleteUser failed', error);
    throw error;
  }
}

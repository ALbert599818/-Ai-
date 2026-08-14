import { axiosForBackend } from '@/lib/lark-shim/http';
import { logger } from '@/lib/lark-shim/logger';
import { handleApiResponse } from '@client/src/utils/handleApiResponse';
import type { AxiosResponse } from 'axios';
import type { LoginRequest, LoginResponse, SessionResponse } from '@shared/auth';

export type { LoginRequest, LoginResponse, SessionResponse };

export async function login(data: LoginRequest): Promise<LoginResponse> {
  try {
    const response: AxiosResponse<LoginResponse> =
      await axiosForBackend.post('/api/auth/login', data);
    return handleApiResponse(response);
  } catch (error) {
    logger.error('login failed', error);
    throw error;
  }
}

export async function issueToken(): Promise<LoginResponse> {
  try {
    const response: AxiosResponse<LoginResponse> =
      await axiosForBackend.post('/api/auth/issue-token');
    return handleApiResponse(response);
  } catch (error) {
    logger.error('issueToken failed', error);
    throw error;
  }
}

export async function getSession(token: string): Promise<SessionResponse> {
  const response: AxiosResponse<SessionResponse> =
    await axiosForBackend.get('/api/auth/session', {
      headers: { Authorization: `Bearer ${token}` },
    });
  return handleApiResponse(response);
}

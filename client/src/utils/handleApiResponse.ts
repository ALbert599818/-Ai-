import type { AxiosResponse } from 'axios';

export function handleApiResponse<T>(response: AxiosResponse<T>): T {
  if (response.status === 403) {
    throw new Error('无操作权限，请联系管理员分配角色');
  }
  const data = response.data;
  if (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as Record<string, unknown>).error === 'object' &&
    (data as Record<string, unknown>).error !== null
  ) {
    const err = (data as Record<string, unknown>).error as Record<string, unknown>;
    const message = err.message;
    throw new Error(
      typeof message === 'string' ? message : '请求失败',
    );
  }
  if (
    typeof data === 'object' &&
    data !== null &&
    'code' in data &&
    'data' in data &&
    typeof (data as Record<string, unknown>).code === 'number'
  ) {
    const code = (data as Record<string, unknown>).code as number;
    if (code !== 0) {
      const message = (data as Record<string, unknown>).message;
      throw new Error(
        typeof message === 'string' ? message : `请求失败 (code: ${code})`,
      );
    }
    return (data as Record<string, unknown>).data as T;
  }
  return data;
}

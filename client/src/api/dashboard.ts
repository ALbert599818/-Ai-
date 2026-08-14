import { axiosForBackend } from '@/lib/lark-shim/http';
import { logger } from '@/lib/lark-shim/logger';
import { handleApiResponse } from '@client/src/utils/handleApiResponse';
import type { DashboardStats, RecentUpdatesResponse } from '@shared/api.interface';

export async function getDashboardStats() {
  try {
    const response = await axiosForBackend.get<DashboardStats>(
      '/api/dashboard/stats'
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('getDashboardStats failed', error);
    throw error;
  }
}

export async function getRecentUpdates() {
  try {
    const response = await axiosForBackend.get<RecentUpdatesResponse>(
      '/api/dashboard/recent-updates'
    );
    return handleApiResponse(response);
  } catch (error) {
    logger.error('getRecentUpdates failed', error);
    throw error;
  }
}

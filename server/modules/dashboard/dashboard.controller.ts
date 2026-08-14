import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtRoleInterceptor } from '@server/common/guards/jwt-role.interceptor';

@Controller('api/dashboard')
@UseInterceptors(JwtRoleInterceptor)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats() {
    const result = await this.dashboardService.getStats();
    return { code: 0, data: result };
  }

  @Get('recent-updates')
  async getRecentUpdates() {
    const result = await this.dashboardService.getRecentUpdates();
    return { code: 0, data: result };
  }
}

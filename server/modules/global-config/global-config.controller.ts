import {
  Controller,
  Get,
  Put,
  Body,
} from '@nestjs/common';
import { NeedLogin } from '@server/lib/platform';
import { UseInterceptors } from '@nestjs/common';
import { JwtRoleInterceptor } from '@server/common/guards/jwt-role.interceptor';
import { GlobalConfigService } from './global-config.service';
import type {
  UpdateExchangeRiskRateRequest,
  UpdateTaxRateRequest,
  UpdateAlertThresholdRequest,
} from '@shared/global-config';

@Controller('api/global-config')
@UseInterceptors(JwtRoleInterceptor)
export class GlobalConfigController {
  constructor(
    private readonly globalConfigService: GlobalConfigService,
  ) {}

  @Get('exchange-risk')
  async getExchangeRiskRate() {
    const result =
      await this.globalConfigService.getExchangeRiskRate();
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Put('exchange-risk')
  async updateExchangeRiskRate(
    @Body() data: UpdateExchangeRiskRateRequest,
  ) {
    const result =
      await this.globalConfigService.updateExchangeRiskRate(
        data.rate,
      );
    return { code: 0, data: result };
  }

  @Get('tax-rate')
  async getTaxRate() {
    const result = await this.globalConfigService.getTaxRate();
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Put('tax-rate')
  async updateTaxRate(
    @Body() data: UpdateTaxRateRequest,
  ) {
    const result =
      await this.globalConfigService.updateTaxRate(data.rate);
    return { code: 0, data: result };
  }

  @Get('alert-threshold')
  async getAlertThreshold() {
    const result =
      await this.globalConfigService.getAlertThreshold();
    return { code: 0, data: result };
  }

  @NeedLogin()
  @Put('alert-threshold')
  async updateAlertThreshold(
    @Body() data: UpdateAlertThresholdRequest,
  ) {
    const result =
      await this.globalConfigService.updateAlertThreshold(
        data.highPercent,
        data.midPercent,
      );
    return { code: 0, data: result };
  }
}

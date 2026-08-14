import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { NeedLogin } from '@server/lib/platform';
import { PricingFormulaConfigService } from './pricing-formula-config.service';
import type { UpdatePricingFormulaConfigDto } from './dto/pricing-formula-config.dto';

@Controller('api/pricing-formula-config')
export class PricingFormulaConfigController {
  constructor(
    private readonly service: PricingFormulaConfigService,
  ) {}

  @Get()
  async getConfig() {
    const data = await this.service.getConfig();
    return { code: 0, data };
  }

  @NeedLogin()
  @Patch()
  async updateConfig(
    @Req() req: { userContext: { roles: string[] } },
    @Body() dto: UpdatePricingFormulaConfigDto,
  ) {
    const roles: string[] = req.userContext?.roles ?? [];
    if (!roles.includes('super_admin')) {
      throw new ForbiddenException(
        'Only super_admin can modify pricing formula config',
      );
    }
    const data = await this.service.updateConfig(dto.configValue);
    return { code: 0, data };
  }

  @NeedLogin()
  @Post('reset')
  async resetConfig(
    @Req() req: { userContext: { roles: string[] } },
  ) {
    const roles: string[] = req.userContext?.roles ?? [];
    if (!roles.includes('super_admin')) {
      throw new ForbiddenException(
        'Only super_admin can reset pricing formula config',
      );
    }
    const data = await this.service.resetToDefault();
    return { code: 0, data };
  }
}

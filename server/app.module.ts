import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { PlatformModule } from '@server/lib/platform';

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { ViewModule } from './modules/view/view.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CustomerLevelModule } from './modules/customer-level/customer-level.module';
import { PriceSensitivityModule } from './modules/price-sensitivity/price-sensitivity.module';
import { CreditTermModule } from './modules/credit-term/credit-term.module';
import { PurchaseQuantityModule } from './modules/purchase-quantity/purchase-quantity.module';
import { LogisticsCostModule } from './modules/logistics-cost/logistics-cost.module';
import { OtherDiscountModule } from './modules/other-discount/other-discount.module';
import { ProductModule } from './modules/product/product.module';
import { ProductCategoryModule } from './modules/product-category/product-category.module';
import { ProductGradeMarginModule } from './modules/product-grade-margin/product-grade-margin.module';
import { FileRecordModule } from './modules/file-record/file-record.module';
import { CustomerModule } from './modules/customer/customer.module';
import { ChannelTypeModule } from './modules/channel-type/channel-type.module';
import { InsuranceModule } from './modules/insurance/insurance.module';
import { AfterSalesReserveModule } from './modules/after-sales-reserve/after-sales-reserve.module';
import { ExcessMarketingModule } from './modules/excess-marketing/excess-marketing.module';
import { GlobalConfigModule } from './modules/global-config/global-config.module';
import { CustomFeeConfigModule } from './modules/custom-fee-config/custom-fee-config.module';
import { MarginOldModule } from './modules/margin-old/margin-old.module';
import { QuotationModule } from './modules/quotation/quotation.module';
import { MyCenterModule } from './modules/my-center/my-center.module';
import { DataImportModule } from './modules/data-import/data-import.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserAccountModule } from './modules/user-account/user-account.module';
import { PricingFormulaConfigModule } from './modules/pricing-formula-config/pricing-formula-config.module';
import { JwtAuthInterceptor } from './middleware/jwt-auth.interceptor';

@Module({
  imports: [
    // 平台 Module，提供平台能力
    PlatformModule.forRoot({
      authz: {},
    }),
    // ====== @route-section: business-modules START ======
    DashboardModule,
    CustomerLevelModule,
    PriceSensitivityModule,
    CreditTermModule,
    PurchaseQuantityModule,
    LogisticsCostModule,
    OtherDiscountModule,
    ProductModule,
    ProductCategoryModule,
    ProductGradeMarginModule,
    FileRecordModule,
    CustomerModule,
    ChannelTypeModule,
    InsuranceModule,
    AfterSalesReserveModule,
    ExcessMarketingModule,
    GlobalConfigModule,
    CustomFeeConfigModule,
    MarginOldModule,
    QuotationModule,
    MyCenterModule,
    DataImportModule,
    AuthModule,
    UserAccountModule,
    PricingFormulaConfigModule,
    // ====== @route-section: business-modules END ======

    // ⚠️ @route-order: last
    // ViewModule is the fallback route module, must be registered last.
    ViewModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: JwtAuthInterceptor,
    },
  ],
})
export class AppModule {}

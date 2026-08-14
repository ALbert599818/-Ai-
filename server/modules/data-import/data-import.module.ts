import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { DataImportController } from './data-import.controller';
import { DataImportService } from './data-import.service';

@Module({
  controllers: [DataImportController],
  providers: [DataImportService],
  exports: [DataImportService],
})
export class DataImportModule implements OnModuleInit {
  private readonly logger = new Logger(DataImportModule.name);

  constructor(
    private readonly dataImportService: DataImportService,
  ) {}

  async onModuleInit() {
    try {
      const needSeed = await this.dataImportService.needsSeed();
      if (needSeed) {
        this.logger.log('检测到配置表为空，自动初始化示例数据');
        const result = await this.dataImportService.seedDemoData();
        this.logger.log(
          `自动 seed 结果：初始化 ${result.seededTables.length} 张表，跳过 ${result.skippedTables.length} 张`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `自动 seed 失败（不影响应用启动）: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

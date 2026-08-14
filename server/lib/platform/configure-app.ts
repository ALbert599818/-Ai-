import type { NestExpressApplication } from '@nestjs/platform-express';

export interface ConfigureAppOptions {
  /** 与飞书平台版保持兼容的占位参数 */
  disableSwagger?: boolean;
}

/**
 * 替代 @lark-apaas/fullstack-nestjs-core 的 configureApp：
 * 仅做 CORS 与请求体大小限制（导入的 xlsx 走 base64 body，需放大上限）。
 */
export async function configureApp(
  app: NestExpressApplication,
  _options: ConfigureAppOptions = {},
): Promise<void> {
  app.enableCors({ origin: true, credentials: true });
  app.useBodyParser('json', { limit: '50mb' });
  app.useBodyParser('urlencoded', { extended: true, limit: '50mb' });
}

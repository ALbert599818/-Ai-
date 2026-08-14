/**
 * 替代 @lark-apaas/client-toolkit/logger 的轻量实现。
 * 保留与原库一致的 logger.error/warn/log/info/debug 调用形式。
 */
export const logger = {
  error: (...args: unknown[]): void => console.error(...args),
  warn: (...args: unknown[]): void => console.warn(...args),
  log: (...args: unknown[]): void => console.log(...args),
  info: (...args: unknown[]): void => console.info(...args),
  debug: (...args: unknown[]): void => console.debug(...args),
};

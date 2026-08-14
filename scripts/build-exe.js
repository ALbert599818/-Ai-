/**
 * 调用 electron-builder 打包 Windows 便携版 exe。
 * - 自动使用国内镜像加速 Electron 二进制与打包工具的下载；
 * - 图标由 electron-builder.yml 的 win.icon（便携版文件图标）+ afterPack 钩子（内层 exe 运行图标）注入，
 *   规避 winCodeSign 解压符号链接需要管理员权限的问题。
 */
const { execSync } = require('child_process');

process.env.ELECTRON_MIRROR =
  process.env.ELECTRON_MIRROR || 'https://npmmirror.com/mirrors/electron/';
process.env.ELECTRON_BUILDER_BINARIES_MIRROR =
  process.env.ELECTRON_BUILDER_BINARIES_MIRROR ||
  'https://npmmirror.com/mirrors/electron-builder-binaries/';

console.log('[打包 exe] 正在用 electron-builder 打包（首次需下载依赖，约 1-3 分钟）...');
execSync('npx --no-install electron-builder --win portable', {
  stdio: 'inherit',
  shell: true,
});
console.log('\n✔ 打包完成，产物在 release/ 目录。');

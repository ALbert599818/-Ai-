/**
 * electron-builder 的 afterPack 钩子：在应用打包完成、生成便携版之前，
 * 用本地 rcedit 给内层 exe 注入自定义图标（规避 winCodeSign 解压符号链接问题）。
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== 'win32') return;

  const rcedit = path.join(__dirname, '..', 'build', 'rcedit-x64.exe');
  const icon = path.join(__dirname, '..', 'build', 'icon.ico');
  if (!fs.existsSync(rcedit) || !fs.existsSync(icon)) return;

  const exe = path.join(
    context.appOutDir,
    context.packager.appInfo.productFilename + '.exe',
  );
  if (!fs.existsSync(exe)) return;

  try {
    execSync(`"${rcedit}" "${exe}" --set-icon "${icon}"`, { stdio: 'ignore' });
    console.log('  [afterPack] 已注入图标：' + path.basename(exe));
  } catch (e) {
    console.warn('  [afterPack] 图标注入失败：' + e.message);
  }
};

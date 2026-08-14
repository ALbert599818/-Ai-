/**
 * 桌面打包脚本：把「后端 + 前端构建产物 + 便携 Node + 一键启动器」打包到 release/ 目录。
 * 运行 `npm run package:desktop` 后，把 release/ 整个文件夹压缩成 zip 即可发给别人。
 * 对方解压后双击「启动.bat」就能用（无需安装 Node / Docker）。
 *
 * 前提：
 *  1. 已运行 `npm run build`
 *  2. 已在项目根目录 .env 里填好 DATABASE_URL（会一并打包，对方连接同一个数据库）
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const release = path.join(root, 'release');

function step(msg) {
  console.log(`\n[打包] ${msg}`);
}

// 1. 校验构建产物
if (
  !fs.existsSync(path.join(root, 'dist', 'server', 'main.js')) ||
  !fs.existsSync(path.join(root, 'dist', 'client', 'index.html'))
) {
  console.error('✗ 未找到构建产物，请先运行：npm run build');
  process.exit(1);
}

if (!fs.existsSync(path.join(root, '.env'))) {
  console.error('✗ 未找到 .env，请先在项目根目录配置 DATABASE_URL');
  process.exit(1);
}

// 2. 重建 release 目录
step('清空并创建 release/');
// 若之前双击启动过服务器仍在运行，会占用文件导致删除失败，这里加少量重试
fs.rmSync(release, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
fs.mkdirSync(release, { recursive: true });

// 3. 复制构建产物
step('复制 dist/（后端 + 前端）');
fs.cpSync(path.join(root, 'dist'), path.join(release, 'dist'), { recursive: true });

// 4. 复制便携 node.exe（取本机 Node）
step('复制 node.exe（便携运行时）');
fs.copyFileSync(process.execPath, path.join(release, 'node.exe'));

// 5. 复制 .env（含数据库连接）
step('复制 .env（含数据库连接，请确认无误后再发给别人）');
fs.copyFileSync(path.join(root, '.env'), path.join(release, '.env'));

// 6. 复制一键启动器
step('复制启动器 启动.bat');
const launcher = path.join(root, 'scripts', '启动.bat');
if (fs.existsSync(launcher)) {
  fs.copyFileSync(launcher, path.join(release, '启动.bat'));
}

// 7. 复制 package.json / lock，用于生产依赖安装
step('复制 package.json / package-lock.json');
fs.copyFileSync(path.join(root, 'package.json'), path.join(release, 'package.json'));
if (fs.existsSync(path.join(root, 'package-lock.json'))) {
  fs.copyFileSync(path.join(root, 'package-lock.json'), path.join(release, 'package-lock.json'));
}

// 8. 在 release 里安装生产依赖
//    --ignore-scripts：运行时不需要任何构建脚本，跳过可避免 npm 的 allow-scripts 安全拦截
step('安装生产依赖（约 1 分钟）...');

// 外层 `npm run` 会把 .npmrc 的 allow-scripts 配置作为 npm_config_* 环境变量注入，
// 导致内层 npm install 误判为「--allow-scripts 不允许在项目级安装中使用」而报错。
// 这里清除相关环境变量，避免该问题。
const cleanEnv = { ...process.env };
delete cleanEnv.npm_config_allow_scripts;
delete cleanEnv.NPM_CONFIG_ALLOW_SCRIPTS;

execSync('npm install --omit=dev --ignore-scripts --no-audit --no-fund', {
  cwd: release,
  stdio: 'inherit',
  shell: true,
  env: cleanEnv,
});

// 清理多余的 package.json（运行时用不到，但保留也无妨）
console.log('\n✔ 打包完成！');
console.log('  把 release/ 文件夹压缩成 zip，发给别人即可。');
console.log('  对方解压后双击「启动.bat」就能使用。');

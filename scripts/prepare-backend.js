/**
 * 准备 Electron 打包所需的后端运行时目录 backend-staging/：
 *   dist/（后端+前端构建产物） + 生产依赖 node_modules/ + .env
 * 供 electron-builder 的 extraResources 原样打进 exe。
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const staging = path.join(root, 'backend-staging');

function step(msg) {
  console.log(`\n[准备后端] ${msg}`);
}

if (!fs.existsSync(path.join(root, 'dist', 'server', 'main.js'))) {
  console.error('✗ 未找到后端构建产物，请先运行：npm run build');
  process.exit(1);
}
if (!fs.existsSync(path.join(root, 'dist', 'client', 'index.html'))) {
  console.error('✗ 未找到前端构建产物，请先运行：npm run build');
  process.exit(1);
}
if (!fs.existsSync(path.join(root, '.env'))) {
  console.error('✗ 未找到 .env，请先配置 DATABASE_URL');
  process.exit(1);
}

step('清空并创建 backend-staging/');
fs.rmSync(staging, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
fs.mkdirSync(staging, { recursive: true });

step('复制 dist/');
fs.cpSync(path.join(root, 'dist'), path.join(staging, 'dist'), { recursive: true });

step('复制 .env（含数据库连接）');
fs.copyFileSync(path.join(root, '.env'), path.join(staging, '.env'));

step('复制 package.json / package-lock.json');
fs.copyFileSync(path.join(root, 'package.json'), path.join(staging, 'package.json'));
if (fs.existsSync(path.join(root, 'package-lock.json'))) {
  fs.copyFileSync(path.join(root, 'package-lock.json'), path.join(staging, 'package-lock.json'));
}

step('安装生产依赖（约 1 分钟）...');
// 清除外层 `npm run` 注入的 allow-scripts 环境变量，避免内层 npm install 误判
const cleanEnv = { ...process.env };
delete cleanEnv.npm_config_allow_scripts;
delete cleanEnv.NPM_CONFIG_ALLOW_SCRIPTS;
execSync('npm install --omit=dev --ignore-scripts --no-audit --no-fund', {
  cwd: staging,
  stdio: 'inherit',
  shell: true,
  env: cleanEnv,
});

console.log('\n✔ 后端目录已就绪，可进行 Electron 打包。');

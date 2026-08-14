// Electron 主进程：启动后端（静默）→ 打开独立窗口加载前端
const { app, BrowserWindow, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const PORT = process.env.SERVER_PORT || 3000;
const URL = `http://localhost:${PORT}`;

let backend = null;

// 后端目录：打包后位于 resources/backend，开发时位于项目根目录
function backendDir() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'backend')
    : path.join(__dirname, '..');
}

function startBackend() {
  const serverJs = path.join(backendDir(), 'dist', 'server', 'main.js');
  backend = spawn(process.execPath, [serverJs], {
    cwd: backendDir(),
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', SERVER_HOST: 'localhost', SERVER_PORT: String(PORT) },
    stdio: 'ignore',
    windowsHide: true,
  });
  backend.on('exit', () => { backend = null; });
}

function waitForServer(url, cb) {
  const started = Date.now();
  const check = () => {
    if (Date.now() - started > 20000) {
      cb(new Error('后端启动超时'));
      return;
    }
    const req = http.get(url, (res) => {
      res.resume();
      cb(null);
    });
    req.on('error', () => setTimeout(check, 300));
  };
  check();
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    autoHideMenuBar: true,
    title: '智能报价系统',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL(URL);

  // 外部链接用系统默认浏览器打开，不在应用窗口内跳转
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  startBackend();
  waitForServer(`${URL}/`, (err) => {
    if (err) {
      // 启动失败也打开窗口，页面会显示连接失败，方便排查
      createWindow();
      return;
    }
    createWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('before-quit', () => {
  if (backend) {
    try { backend.kill(); } catch (_) { /* ignore */ }
  }
});

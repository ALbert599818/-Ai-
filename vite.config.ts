import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const projectRoot = process.cwd();
const clientRoot = path.resolve(projectRoot, 'client');

// 独立的 Vite 配置（不再依赖 @lark-apaas/fullstack-vite-preset）
export default defineConfig({
  root: clientRoot,
  plugins: [react()],
  define: {
    // 让前端 `process.env.CLIENT_BASE_PATH` 在构建期被替换为常量
    'process.env.CLIENT_BASE_PATH': JSON.stringify(
      process.env.CLIENT_BASE_PATH || '/',
    ),
  },
  resolve: {
    alias: {
      '@': path.resolve(clientRoot, 'src'),
      '@client': clientRoot,
      '@shared': path.resolve(projectRoot, 'shared'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.SERVER_PROXY_TARGET || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: path.resolve(projectRoot, 'dist/client'),
    emptyOutDir: true,
  },
});

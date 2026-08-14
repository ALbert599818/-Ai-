import axios from 'axios';

/**
 * 替代 @lark-apaas/client-toolkit/utils/getAxiosForBackend。
 * 相对路径请求，开发环境由 Vite 代理到后端，生产/桌面模式同源。
 */
export const axiosForBackend = axios.create({
  baseURL: '',
  timeout: 60000,
});

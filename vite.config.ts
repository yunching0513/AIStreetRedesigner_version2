import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { handleApiRequest } from './server/devApi';

// 開發模式下模擬 Vercel 的 /api serverless functions，
// 共用 server/gemini.ts 的邏輯；API 金鑰只存在於 Node 端，不進入前端 bundle。
const devApiPlugin = (): Plugin => ({
  name: 'dev-api',
  configureServer(server) {
    server.middlewares.use('/api', apiMiddleware);
  },
  configurePreviewServer(server) {
    server.middlewares.use('/api', apiMiddleware);
  },
});

const apiMiddleware = (req: Parameters<typeof handleApiRequest>[0], res: Parameters<typeof handleApiRequest>[1]) => {
  void handleApiRequest(req, res).catch((error) => {
    console.error('Dev API error:', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    }
    res.end(JSON.stringify({ error: '伺服器發生錯誤' }));
  });
};

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // 提供給開發中介層（server/gemini.ts 由 process.env 讀取金鑰）
    if (env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY) {
      process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
    }
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), devApiPlugin()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

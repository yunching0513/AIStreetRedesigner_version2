// 本機開發用的 /api 中介層：讓 npm run dev 也走與 Vercel 相同的伺服器端邏輯，
// 前端程式碼在開發與正式環境行為一致。
import type { IncomingMessage, ServerResponse } from 'http';
import {
  generateImage,
  startVideo,
  getVideoStatus,
  fetchVideo,
  toErrorPayload,
  HttpError,
} from './gemini';
import { getMapsConfig, geocode, fetchStreetView } from './maps';

const MAX_BODY_BYTES = 25 * 1024 * 1024;

const readJson = (req: IncomingMessage): Promise<Record<string, unknown>> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new HttpError(413, '請求內容過大。'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch {
        reject(new HttpError(400, '無效的 JSON 內容。'));
      }
    });
    req.on('error', () => reject(new HttpError(400, '讀取請求失敗。')));
  });

const sendJson = (res: ServerResponse, status: number, payload: unknown) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
};

// 掛載於 '/api' 之下，req.url 已去除前綴（如 '/generate'）
export const handleApiRequest = async (
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const route = `${req.method} ${url.pathname}`;
  try {
    switch (route) {
      case 'POST /generate':
        sendJson(res, 200, await generateImage(await readJson(req)));
        return;
      case 'POST /video-start':
        sendJson(res, 200, await startVideo(await readJson(req)));
        return;
      case 'POST /video-status': {
        const body = (await readJson(req)) as { operationName?: string };
        sendJson(res, 200, await getVideoStatus(body.operationName ?? ''));
        return;
      }
      case 'GET /video-download': {
        const upstream = await fetchVideo(url.searchParams.get('uri') ?? '');
        res.writeHead(200, {
          'Content-Type': upstream.headers.get('content-type') ?? 'video/mp4',
        });
        res.end(Buffer.from(await upstream.arrayBuffer()));
        return;
      }
      case 'GET /maps-config':
        sendJson(res, 200, getMapsConfig());
        return;
      case 'GET /geocode':
        sendJson(res, 200, await geocode(url.searchParams.get('q') ?? ''));
        return;
      case 'GET /streetview': {
        const upstream = await fetchStreetView({
          pano: url.searchParams.get('pano'),
          heading: url.searchParams.get('heading'),
          pitch: url.searchParams.get('pitch'),
          fov: url.searchParams.get('fov'),
        });
        res.writeHead(200, {
          'Content-Type': upstream.headers.get('content-type') ?? 'image/jpeg',
        });
        res.end(Buffer.from(await upstream.arrayBuffer()));
        return;
      }
      default:
        sendJson(res, 404, { error: 'Not found' });
    }
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    sendJson(res, status, body);
  }
};

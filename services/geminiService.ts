// 前端不再持有 API 金鑰：所有 Gemini 呼叫改走同源的 /api 代理
// （正式環境為 Vercel serverless functions，開發環境為 Vite 中介層）。
import { GeneratedImageResult } from "../types";

const VIDEO_POLL_INTERVAL_MS = 10000;

const postJson = async <T>(url: string, body: unknown): Promise<T> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null;
  if (!response.ok || !data) {
    throw new Error(data?.error ?? `請求失敗 (HTTP ${response.status})`);
  }
  return data;
};

export const editStreetImage = async (
  base64Image: string,
  prompt: string,
  maskBase64?: string | null,
  guidelineId?: string | null
): Promise<GeneratedImageResult> => {
  return postJson<GeneratedImageResult>('/api/generate', {
    image: base64Image,
    prompt,
    mask: maskBase64 ?? null,
    guideline: guidelineId ?? null,
  });
};

export interface StreetSuggestion {
  title: string;
  description: string;
  instruction: string;
}

export const analyzeStreet = async (
  base64Image: string,
  guidelineId?: string | null
): Promise<StreetSuggestion[]> => {
  const result = await postJson<{ suggestions: StreetSuggestion[] }>('/api/analyze', {
    image: base64Image,
    guideline: guidelineId ?? null,
  });
  return result.suggestions;
};

interface VideoStatusResponse {
  done: boolean;
  uri?: string;
  error?: string;
}

export const generateStreetVideo = async (
  base64Image: string,
  prompt: string,
  onProgress?: (message: string) => void
): Promise<string> => {
  onProgress?.('提交影片生成請求...');

  let status = await postJson<VideoStatusResponse & { operationName: string }>(
    '/api/video-start',
    { image: base64Image, prompt }
  );
  const { operationName } = status;

  while (!status.done) {
    onProgress?.('Veo 正在生成影片（約需 1〜3 分鐘）...');
    await new Promise((r) => setTimeout(r, VIDEO_POLL_INTERVAL_MS));
    status = { operationName, ...(await postJson<VideoStatusResponse>('/api/video-status', { operationName })) };
  }

  if (status.error) {
    throw new Error(status.error);
  }
  if (!status.uri) {
    throw new Error('未取得影片內容，可能被安全政策擋下，請調整描述後再試。');
  }

  onProgress?.('下載影片中...');
  const download = await fetch(`/api/video-download?uri=${encodeURIComponent(status.uri)}`);
  if (!download.ok) {
    const data = (await download.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? `影片下載失敗 (HTTP ${download.status})`);
  }
  const blob = await download.blob();
  return URL.createObjectURL(blob);
};

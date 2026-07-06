// Google 地圖相關的伺服器端邏輯：
// - Maps JavaScript API 金鑰屬前端公開金鑰（應以 HTTP referrer 限制保護），由 config 端點下發
// - 街景靜態圖與地理編碼走伺服器代理，避免瀏覽器直連與 canvas 汙染問題
import { HttpError } from './gemini';

const MAPS_API_HOST = 'maps.googleapis.com';

const getMapsKey = (): string => {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new HttpError(500, '伺服器未設定 GOOGLE_MAPS_API_KEY，請在環境變數中加入。');
  }
  return key;
};

export const getMapsConfig = (): { mapsApiKey: string | null } => ({
  mapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? null,
});

export const geocode = async (
  query: string
): Promise<{ lat: number; lng: number; address: string }> => {
  if (!query.trim()) throw new HttpError(400, '請輸入要搜尋的地點。');

  const url = new URL(`https://${MAPS_API_HOST}/maps/api/geocode/json`);
  url.searchParams.set('address', query);
  url.searchParams.set('language', 'zh-TW');
  url.searchParams.set('key', getMapsKey());

  const response = await fetch(url);
  const data = (await response.json().catch(() => null)) as {
    status?: string;
    results?: Array<{
      geometry?: { location?: { lat: number; lng: number } };
      formatted_address?: string;
    }>;
  } | null;

  if (!response.ok || !data) {
    throw new HttpError(502, `地點搜尋失敗 (HTTP ${response.status})`);
  }
  const first = data.results?.[0];
  if (data.status !== 'OK' || !first?.geometry?.location) {
    throw new HttpError(404, '找不到該地點，請換個關鍵字試試。');
  }
  return {
    lat: first.geometry.location.lat,
    lng: first.geometry.location.lng,
    address: first.formatted_address ?? query,
  };
};

export interface StreetViewParams {
  pano?: string | null;
  heading?: string | null;
  pitch?: string | null;
  fov?: string | null;
}

const parseNumber = (value: string | null | undefined, name: string, min: number, max: number): number => {
  const num = Number(value);
  if (value == null || value === '' || !Number.isFinite(num)) {
    throw new HttpError(400, `無效的參數 ${name}。`);
  }
  return Math.min(max, Math.max(min, num));
};

export const fetchStreetView = async (params: StreetViewParams): Promise<globalThis.Response> => {
  const pano = params.pano ?? '';
  if (!/^[\w-]{1,128}$/.test(pano)) {
    throw new HttpError(400, '無效的街景全景代號。');
  }
  const heading = parseNumber(params.heading, 'heading', 0, 360);
  const pitch = parseNumber(params.pitch, 'pitch', -90, 90);
  const fov = parseNumber(params.fov, 'fov', 10, 120);

  const url = new URL(`https://${MAPS_API_HOST}/maps/api/streetview`);
  url.searchParams.set('size', '640x640');
  url.searchParams.set('pano', pano);
  url.searchParams.set('heading', String(heading));
  url.searchParams.set('pitch', String(pitch));
  url.searchParams.set('fov', String(fov));
  url.searchParams.set('source', 'outdoor');
  url.searchParams.set('key', getMapsKey());

  const response = await fetch(url);
  if (!response.ok || !(response.headers.get('content-type') ?? '').startsWith('image/')) {
    throw new HttpError(502, `街景圖擷取失敗 (HTTP ${response.status})`);
  }
  return response;
};

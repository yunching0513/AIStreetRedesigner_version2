// 伺服器端 Gemini 邏輯：API 金鑰只在這裡使用，不會進入前端 bundle。
// 由 Vercel serverless functions（api/*.ts）與本機開發中介層（server/devApi.ts）共用。
import { GoogleGenAI } from '@google/genai';
import { getGuidelineById } from '../shared/designGuidelines';

const IMAGE_MODEL = 'gemini-2.5-flash-image';
const TEXT_MODEL = 'gemini-2.5-flash';
const VIDEO_MODEL = 'veo-3.0-fast-generate-001';
const GEMINI_API_HOST = 'generativelanguage.googleapis.com';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const getApiKey = (): string => {
  const key = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!key) {
    throw new HttpError(500, '伺服器未設定 GEMINI_API_KEY，請在部署平台的環境變數中加入。');
  }
  return key;
};

const parseDataUrl = (dataUrl: string): { mimeType: string; data: string } => {
  const match = dataUrl.match(/^data:(image\/[a-z+.-]+);base64,(.*)$/i);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  return { mimeType: 'image/jpeg', data: dataUrl };
};

export interface GenerateImageBody {
  image?: string;
  prompt?: string;
  mask?: string | null;
  guideline?: string | null;
}

export interface GenerateImageResult {
  imageUrl?: string;
  text?: string;
}

export const generateImage = async (body: GenerateImageBody): Promise<GenerateImageResult> => {
  const { image, prompt, mask, guideline } = body;
  if (!image || typeof image !== 'string') throw new HttpError(400, '缺少圖片內容。');
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) throw new HttpError(400, '缺少改造指令。');
  if (guideline && !getGuidelineById(guideline)) throw new HttpError(400, '無效的設計準則。');

  const guidelineBrief = getGuidelineById(guideline)?.brief;
  const standardsClause = guidelineBrief
    ? ` The redesign MUST follow these professional street design standards: ${guidelineBrief}`
    : '';

  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const original = parseDataUrl(image);
  const parts: Array<Record<string, unknown>> = [];

  if (mask) {
    const maskImage = parseDataUrl(mask);
    parts.push(
      {
        text: `You are given two images: the first is a street view photo, the second is a black-and-white mask of the same size. The WHITE area of the mask marks the ONLY region you are allowed to modify. Apply the following instruction strictly inside that region: ${prompt}.${standardsClause} Keep everything outside the white region completely unchanged, pixel-identical to the original photo. Keep the perspective and lighting consistent. Output the full edited photo without any mask overlay or markings.`,
      },
      { inlineData: { mimeType: original.mimeType, data: original.data } },
      { inlineData: { mimeType: maskImage.mimeType, data: maskImage.data } }
    );
  } else {
    parts.push(
      {
        text: `This is a street view image. Please modify it based on the following instruction: ${prompt}.${standardsClause} Keep the perspective and lighting consistent.`,
      },
      { inlineData: { mimeType: original.mimeType, data: original.data } }
    );
  }

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: { parts },
  });

  const result: GenerateImageResult = {};
  const responseParts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of responseParts) {
    if (part.inlineData) {
      result.imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    } else if (part.text) {
      result.text = part.text;
    }
  }

  if (!result.imageUrl && !result.text) {
    throw new HttpError(502, '未能生成內容，可能被安全政策擋下，請調整指令後再試。');
  }
  return result;
};

export interface AnalyzeBody {
  image?: string;
  guideline?: string | null;
}

export interface StreetSuggestion {
  title: string;
  description: string;
  instruction: string;
}

// AI 街道體檢：以文字模型依設計準則分析街景，回傳可直接套用的改善建議
export const analyzeStreet = async (body: AnalyzeBody): Promise<{ suggestions: StreetSuggestion[] }> => {
  const { image, guideline } = body;
  if (!image || typeof image !== 'string') throw new HttpError(400, '缺少圖片內容。');
  if (guideline && !getGuidelineById(guideline)) throw new HttpError(400, '無效的設計準則。');

  const brief = getGuidelineById(guideline)?.brief;
  const standards = brief
    ? `Evaluate the street against these specific design standards: ${brief}`
    : 'Evaluate the street against widely accepted urban street design standards (NACTO Urban Street Design Guide, Global Street Design Guide, Complete Streets): pedestrian safety and comfort, traffic calming, protected cycling infrastructure, transit quality, greenery and climate resilience.';

  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const original = parseDataUrl(image);

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: {
      parts: [
        {
          text: `You are a professional urban street designer. Analyze this street view photo. ${standards}

Identify the 3 to 5 most impactful, physically visible problems and propose one concrete improvement for each. Respond with ONLY a JSON array, no markdown, in this exact shape:
[{"title": "...", "description": "...", "instruction": "..."}]

- "title": short label in Traditional Chinese (zh-TW), at most 12 characters
- "description": one sentence in Traditional Chinese explaining the problem and the improvement, citing the relevant standard (e.g. 人行道淨寬、車道寬度)
- "instruction": an English image-editing instruction for a generative image model, describing the specific physical change to make in this photo`,
        },
        { inlineData: { mimeType: original.mimeType, data: original.data } },
      ],
    },
    config: {
      responseMimeType: 'application/json',
    },
  });

  const text = response.text ?? '';
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new HttpError(502, 'AI 分析結果格式異常，請再試一次。');
  }
  if (!Array.isArray(parsed)) {
    throw new HttpError(502, 'AI 分析結果格式異常，請再試一次。');
  }
  const suggestions = parsed
    .filter(
      (s): s is StreetSuggestion =>
        !!s &&
        typeof (s as StreetSuggestion).title === 'string' &&
        typeof (s as StreetSuggestion).instruction === 'string'
    )
    .slice(0, 5)
    .map((s) => ({
      title: s.title,
      description: typeof s.description === 'string' ? s.description : '',
      instruction: s.instruction,
    }));

  if (suggestions.length === 0) {
    throw new HttpError(502, 'AI 未能提出建議，請再試一次。');
  }
  return { suggestions };
};

export interface VideoStartBody {
  image?: string;
  prompt?: string;
}

export interface VideoStatusResult {
  done: boolean;
  uri?: string;
  error?: string;
}

const extractVideoUri = (operation: unknown): string | undefined => {
  const op = operation as {
    response?: {
      generatedVideos?: Array<{ video?: { uri?: string } }>;
      generateVideoResponse?: { generatedSamples?: Array<{ video?: { uri?: string } }> };
    };
  };
  return (
    op.response?.generatedVideos?.[0]?.video?.uri ??
    op.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri
  );
};

export const startVideo = async (
  body: VideoStartBody
): Promise<{ operationName: string } & VideoStatusResult> => {
  const { image, prompt } = body;
  if (!image || typeof image !== 'string') throw new HttpError(400, '缺少圖片內容。');
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) throw new HttpError(400, '缺少影片描述。');

  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const first = parseDataUrl(image);

  const operation = await ai.models.generateVideos({
    model: VIDEO_MODEL,
    prompt,
    image: { imageBytes: first.data, mimeType: first.mimeType },
  });

  if (!operation.name) {
    throw new HttpError(502, '影片生成請求未回傳操作代號。');
  }
  return {
    operationName: operation.name,
    done: !!operation.done,
    uri: extractVideoUri(operation),
    error: operation.error ? String(operation.error.message ?? '影片生成失敗') : undefined,
  };
};

export const getVideoStatus = async (operationName: string): Promise<VideoStatusResult> => {
  if (
    !operationName ||
    !/^[\w.-]+(\/[\w.-]+)*$/.test(operationName) ||
    operationName.split('/').some((segment) => segment === '.' || segment === '..')
  ) {
    throw new HttpError(400, '無效的操作代號。');
  }
  const response = await fetch(
    `https://${GEMINI_API_HOST}/v1beta/${operationName}?key=${getApiKey()}`
  );
  const op = (await response.json().catch(() => null)) as
    | { done?: boolean; error?: { message?: string } }
    | null;
  if (!response.ok || !op) {
    throw new HttpError(502, `查詢影片進度失敗 (HTTP ${response.status})`);
  }
  return {
    done: !!op.done,
    uri: extractVideoUri(op),
    error: op.error ? String(op.error.message ?? '影片生成失敗') : undefined,
  };
};

// 代理影片下載：金鑰附加在伺服器端，且僅允許 Gemini 官方檔案主機，避免 SSRF 或金鑰外洩
export const fetchVideo = async (uri: string): Promise<globalThis.Response> => {
  let url: URL;
  try {
    url = new URL(uri);
  } catch {
    throw new HttpError(400, '無效的影片位址。');
  }
  if (url.protocol !== 'https:' || url.hostname !== GEMINI_API_HOST) {
    throw new HttpError(400, '不允許的影片下載來源。');
  }
  url.searchParams.set('key', getApiKey());
  const response = await fetch(url);
  if (!response.ok) {
    throw new HttpError(502, `影片下載失敗 (HTTP ${response.status})`);
  }
  return response;
};

export const toErrorPayload = (error: unknown): { status: number; body: { error: string } } => {
  if (error instanceof HttpError) {
    return { status: error.status, body: { error: error.message } };
  }
  console.error('API Error:', error);
  const message = error instanceof Error ? error.message : '發生未知錯誤';
  return { status: 500, body: { error: message } };
};

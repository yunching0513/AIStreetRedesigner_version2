import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedImageResult, StreetSuggestion } from "../types";

const IMAGE_MODEL = 'gemini-2.5-flash-image';
const TEXT_MODEL = 'gemini-2.5-flash';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }
  return new GoogleGenAI({ apiKey });
};

const stripDataUrl = (base64Image: string): string =>
  base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

export const editStreetImage = async (
  base64Image: string,
  prompt: string
): Promise<GeneratedImageResult> => {
  const ai = getClient();
  const cleanedBase64 = stripDataUrl(base64Image);

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: {
      parts: [
        {
          text: `This is a street view image. Please modify it based on the following instruction: ${prompt}. Keep the perspective and lighting consistent with the original photo.`,
        },
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanedBase64,
          },
        },
      ],
    },
  });

  const result: GeneratedImageResult = {};
  const parts = response.candidates?.[0]?.content?.parts;
  if (parts) {
    for (const part of parts) {
      if (part.inlineData) {
        result.imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      } else if (part.text) {
        result.text = part.text;
      }
    }
  }

  if (!result.imageUrl) {
    throw new Error("模型沒有回傳圖片。");
  }

  return result;
};

export const generateVariants = async (
  base64Image: string,
  prompt: string,
  count: number,
  onSlotUpdate: (index: number, slot: { status: 'done' | 'error'; image?: string; error?: string }) => void
): Promise<void> => {
  await Promise.all(
    Array.from({ length: count }, async (_, i) => {
      try {
        const result = await editStreetImage(base64Image, prompt);
        if (result.imageUrl) {
          onSlotUpdate(i, { status: 'done', image: result.imageUrl });
        } else {
          onSlotUpdate(i, { status: 'error', error: '無生成結果' });
        }
      } catch (e) {
        onSlotUpdate(i, {
          status: 'error',
          error: e instanceof Error ? e.message : '未知錯誤',
        });
      }
    })
  );
};

export const analyzeStreetImage = async (
  base64Image: string
): Promise<StreetSuggestion[]> => {
  const ai = getClient();
  const cleanedBase64 = stripDataUrl(base64Image);

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: {
      parts: [
        {
          text: `你是一位專注於人本城市設計的規劃顧問，正在協助一位台灣的市政官員。請仔細觀察這張街景照片，找出 3 個最值得改善的具體問題，並各提供一個改造建議。

請以繁體中文回答，並避免空泛建議。每項包含：
- title：很短的中文標題（4 到 8 個字）
- problem：你觀察到的具體問題（一句中文，描述當下的狀況）
- prompt：給圖像生成模型的英文改造指令（具體、可視覺化、明確說明要加 / 改 / 移除什麼）

只回傳 JSON 陣列。`,
        },
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanedBase64,
          },
        },
      ],
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            problem: { type: Type.STRING },
            prompt: { type: Type.STRING },
          },
          required: ['title', 'problem', 'prompt'],
        },
      },
    },
  });

  const raw = response.text;
  if (!raw) throw new Error("分析回傳為空");

  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("分析格式不正確");

  return parsed.slice(0, 3).map((item) => ({
    title: String(item.title ?? ''),
    problem: String(item.problem ?? ''),
    prompt: String(item.prompt ?? ''),
  }));
};

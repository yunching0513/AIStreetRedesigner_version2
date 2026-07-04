import { GoogleGenAI } from "@google/genai";
import { GeneratedImageResult } from "../types";
import { parseDataUrl } from "../utils/imageUtils";

// Using the specified "Nano Banana" alias model name
const MODEL_NAME = 'gemini-2.5-flash-image';

// Veo image-to-video：以改造後的圖片為首幀生成動態影片
const VIDEO_MODEL_NAME = 'veo-3.0-fast-generate-001';
const VIDEO_POLL_INTERVAL_MS = 10000;

export const editStreetImage = async (
  base64Image: string,
  prompt: string,
  maskBase64?: string | null
): Promise<GeneratedImageResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const original = parseDataUrl(base64Image);

  const parts: Array<Record<string, unknown>> = [];

  if (maskBase64) {
    const mask = parseDataUrl(maskBase64);
    parts.push(
      {
        text: `You are given two images: the first is a street view photo, the second is a black-and-white mask of the same size. The WHITE area of the mask marks the ONLY region you are allowed to modify. Apply the following instruction strictly inside that region: ${prompt}. Keep everything outside the white region completely unchanged, pixel-identical to the original photo. Keep the perspective and lighting consistent. Output the full edited photo without any mask overlay or markings.`,
      },
      {
        inlineData: {
          mimeType: original.mimeType,
          data: original.data,
        },
      },
      {
        inlineData: {
          mimeType: mask.mimeType,
          data: mask.data,
        },
      }
    );
  } else {
    parts.push(
      {
        text: `This is a street view image. Please modify it based on the following instruction: ${prompt}. Keep the perspective and lighting consistent.`,
      },
      {
        inlineData: {
          mimeType: original.mimeType,
          data: original.data,
        },
      }
    );
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
    });

    const result: GeneratedImageResult = {};

    // Iterate through parts to find the generated image
    if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          result.imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        } else if (part.text) {
          result.text = part.text;
        }
      }
    }

    if (!result.imageUrl && !result.text) {
        throw new Error("No content generated.");
    }

    return result;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateStreetVideo = async (
  base64Image: string,
  prompt: string,
  onProgress?: (message: string) => void
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const image = parseDataUrl(base64Image);

  onProgress?.('提交影片生成請求...');

  let operation = await ai.models.generateVideos({
    model: VIDEO_MODEL_NAME,
    prompt,
    image: {
      imageBytes: image.data,
      mimeType: image.mimeType,
    },
  });

  while (!operation.done) {
    onProgress?.('Veo 正在生成影片（約需 1〜3 分鐘）...');
    await new Promise((r) => setTimeout(r, VIDEO_POLL_INTERVAL_MS));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  if (operation.error) {
    throw new Error(String(operation.error.message ?? '影片生成失敗'));
  }

  // SDK 正式欄位為 response.generatedVideos；保留對 REST 原始
  // 回應格式（generateVideoResponse.generatedSamples）的相容處理。
  const rawResponse = operation.response as
    | (typeof operation.response & {
        generateVideoResponse?: { generatedSamples?: Array<{ video?: { uri?: string } }> };
      })
    | undefined;
  const video =
    rawResponse?.generatedVideos?.[0]?.video ??
    rawResponse?.generateVideoResponse?.generatedSamples?.[0]?.video;

  if (!video?.uri) {
    throw new Error('未取得影片內容，可能被安全政策擋下，請調整描述後再試。');
  }

  onProgress?.('下載影片中...');
  const separator = video.uri.includes('?') ? '&' : '?';
  const response = await fetch(`${video.uri}${separator}key=${apiKey}`);
  if (!response.ok) {
    throw new Error(`影片下載失敗 (HTTP ${response.status})`);
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

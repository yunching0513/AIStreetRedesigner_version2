import { GoogleGenAI } from "@google/genai";
import { GeneratedImageResult } from "../types";
import { parseDataUrl } from "../utils/imageUtils";

// Using the specified "Nano Banana" alias model name
const MODEL_NAME = 'gemini-2.5-flash-image';

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

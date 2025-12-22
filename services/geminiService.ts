import { GoogleGenAI } from "@google/genai";
import { GeneratedImageResult } from "../types";

// Using the specified "Nano Banana" alias model name
const MODEL_NAME = 'gemini-2.5-flash-image';

export const editStreetImage = async (
  base64Image: string,
  prompt: string
): Promise<GeneratedImageResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Clean the base64 string if it contains the data URL prefix
  const cleanedBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            text: `This is a street view image. Please modify it based on the following instruction: ${prompt}. Keep the perspective and lighting consistent.`,
          },
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming JPEG for simplicity, or detect from upload
              data: cleanedBase64,
            },
          },
        ],
      },
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
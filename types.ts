export interface AppState {
  originalImage: string | null;
  maskImage: string | null;
  generatedImage: string | null;
  isGenerating: boolean;
  error: string | null;
}

export interface GeneratedImageResult {
  imageUrl?: string;
  text?: string;
}

export interface HistoryEntry {
  id: string;
  image: string;
  prompt: string;
  createdAt: number;
}

export interface PresetPrompt {
  id: string;
  label: string;
  value: string;
  category: 'safety' | 'greenery' | 'transit' | 'aesthetic';
}

export enum PromptCategory {
  SAFETY = 'safety',
  GREENERY = 'greenery',
  TRANSIT = 'transit',
  AESTHETIC = 'aesthetic'
}
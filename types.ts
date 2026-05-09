export interface AppState {
  history: HistoryEntry[];
  currentIndex: number;
  variants: VariantSlot[];
  variantPrompt: string | null;
  suggestions: StreetSuggestion[];
  isAnalyzing: boolean;
  isGenerating: boolean;
  error: string | null;
}

export interface HistoryEntry {
  image: string;
  prompt: string;
  timestamp: number;
}

export interface VariantSlot {
  status: 'pending' | 'done' | 'error';
  image?: string;
  error?: string;
}

export interface StreetSuggestion {
  title: string;
  problem: string;
  prompt: string;
}

export interface GeneratedImageResult {
  imageUrl?: string;
  text?: string;
}

export interface PresetPrompt {
  id: string;
  label: string;
  value: string;
  category: 'safety' | 'greenery' | 'transit' | 'aesthetic' | 'taitung';
}

export enum PromptCategory {
  SAFETY = 'safety',
  GREENERY = 'greenery',
  TRANSIT = 'transit',
  AESTHETIC = 'aesthetic',
  TAITUNG = 'taitung'
}

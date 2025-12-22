import React from 'react';
import { PresetPrompt, PromptCategory } from '../types';

interface PromptPanelProps {
  promptText: string;
  setPromptText: (text: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
}

const PRESETS: PresetPrompt[] = [
  { id: '1', label: '拓寬人行道', value: 'Widen the sidewalks to make them pedestrian friendly.', category: PromptCategory.SAFETY },
  { id: '2', label: '增加公車彎', value: 'Add a bus bay pullout for public transport.', category: PromptCategory.TRANSIT },
  { id: '3', label: '增加行道樹', value: 'Add trees along the street for shade and greenery.', category: PromptCategory.GREENERY },
  { id: '4', label: '鋪設自行車道', value: 'Add a dedicated bicycle lane painted green.', category: PromptCategory.TRANSIT },
  { id: '5', label: '增設路燈', value: 'Add modern street lamps for better lighting.', category: PromptCategory.SAFETY },
  { id: '6', label: '放置長椅', value: 'Place street benches on the sidewalk.', category: PromptCategory.AESTHETIC },
  { id: '7', label: '歐式風格改造', value: 'Transform the street facades to look like a European old town with cobblestone streets.', category: PromptCategory.AESTHETIC },
  { id: '8', label: '未來主義風格', value: 'Give the street a futuristic cyberpunk look with neon lights.', category: PromptCategory.AESTHETIC },
];

export const PromptPanel: React.FC<PromptPanelProps> = ({ promptText, setPromptText, isGenerating, onGenerate }) => {
  
  const handlePresetClick = (value: string) => {
    // Append or replace? Let's replace for simplicity, or append if empty.
    setPromptText(value);
  };

  return (
    <div className="space-y-6">
      
      {/* Category: Safety & Transit */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">交通與安全</label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.filter(p => p.category === PromptCategory.SAFETY || p.category === PromptCategory.TRANSIT).map(preset => (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset.value)}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm rounded-full transition-colors border border-blue-200"
              disabled={isGenerating}
            >
              + {preset.label}
            </button>
          ))}
        </div>
      </div>

       {/* Category: Greenery & Aesthetics */}
       <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">綠化與美觀</label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.filter(p => p.category === PromptCategory.GREENERY || p.category === PromptCategory.AESTHETIC).map(preset => (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset.value)}
              className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-sm rounded-full transition-colors border border-green-200"
              disabled={isGenerating}
            >
              + {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="custom-prompt" className="text-sm font-medium text-slate-700 block">
          自訂改造指令
        </label>
        <textarea
          id="custom-prompt"
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="例如：把天空變成夕陽，並且增加一些戶外咖啡座..."
          className="w-full h-32 p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none bg-slate-50"
          disabled={isGenerating}
        />
      </div>

      <button
        onClick={onGenerate}
        disabled={isGenerating || !promptText.trim()}
        className={`w-full py-3 px-4 rounded-xl font-bold text-white shadow-lg transition-all transform flex items-center justify-center gap-2
          ${isGenerating || !promptText.trim() 
            ? 'bg-slate-300 cursor-not-allowed shadow-none' 
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0'
          }`}
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            生成中...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            開始改造
          </>
        )}
      </button>
    </div>
  );
};
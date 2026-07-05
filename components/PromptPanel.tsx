import React from 'react';
import { PresetPrompt, PromptCategory } from '../types';
import { DESIGN_GUIDELINES, getGuidelineById } from '../shared/designGuidelines';
import { StreetSuggestion } from '../services/geminiService';

interface PromptPanelProps {
  promptText: string;
  setPromptText: (text: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  guidelineId: string | null;
  setGuidelineId: (id: string | null) => void;
  suggestions: StreetSuggestion[];
  isAnalyzing: boolean;
  onAnalyze: () => void;
}

const PRESETS: PresetPrompt[] = [
  { id: '1', label: '拓寬人行道', value: 'Widen the sidewalk to at least 2.5 meters of clear, unobstructed walking space with smooth accessible paving and tactile guiding strips.', category: PromptCategory.SAFETY },
  { id: '2', label: '行人穿越改善', value: 'Add a raised, high-visibility zebra crossing with curb extensions and a pedestrian refuge island to shorten the crossing distance.', category: PromptCategory.SAFETY },
  { id: '3', label: '增設路燈', value: 'Add modern pedestrian-scale street lamps for better lighting and safety.', category: PromptCategory.SAFETY },
  { id: '4', label: '保護型自行車道', value: 'Add a physically protected green cycle track about 2 meters wide, separated from motor traffic by planters or curbs, not just paint.', category: PromptCategory.TRANSIT },
  { id: '5', label: '公車候車站', value: 'Add a bus boarding island with a shelter, seating, lighting and level boarding platform.', category: PromptCategory.TRANSIT },
  { id: '6', label: '增加行道樹', value: 'Plant street trees with continuous canopy at roughly 8 meter spacing in a planted furniture zone along the street.', category: PromptCategory.GREENERY },
  { id: '7', label: '雨水花園', value: 'Convert curb extensions into rain gardens and bioswales with native plants that capture stormwater.', category: PromptCategory.GREENERY },
  { id: '8', label: '放置街道家具', value: 'Place street benches, bicycle racks and planters in the sidewalk furniture zone without blocking the walking path.', category: PromptCategory.AESTHETIC },
];

export const PromptPanel: React.FC<PromptPanelProps> = ({
  promptText,
  setPromptText,
  isGenerating,
  onGenerate,
  guidelineId,
  setGuidelineId,
  suggestions,
  isAnalyzing,
  onAnalyze,
}) => {

  const handlePresetClick = (value: string) => {
    setPromptText(value);
  };

  const selectedGuideline = getGuidelineById(guidelineId);

  return (
    <div className="space-y-6">

      {/* 設計準則框架 */}
      <div className="space-y-2">
        <label htmlFor="guideline-select" className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          設計準則
        </label>
        <select
          id="guideline-select"
          value={guidelineId ?? ''}
          onChange={(e) => setGuidelineId(e.target.value || null)}
          disabled={isGenerating}
          className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-slate-50"
        >
          <option value="">不指定（自由改造）</option>
          {DESIGN_GUIDELINES.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
        {selectedGuideline && (
          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg space-y-1.5">
            <p className="text-xs text-indigo-800">{selectedGuideline.summary}</p>
            <ul className="text-xs text-indigo-600/90 space-y-0.5 list-disc list-inside">
              {selectedGuideline.principles.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
            <p className="text-[11px] text-indigo-400">生成時將自動要求 AI 遵循上述標準</p>
          </div>
        )}
      </div>

      {/* AI 街道體檢 */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI 街道體檢</label>
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing || isGenerating}
          className="w-full py-2 px-3 bg-white border border-indigo-200 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              依準則分析街道中...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              分析街道問題並提出建議
            </>
          )}
        </button>
        {suggestions.length > 0 && (
          <div className="space-y-1.5">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handlePresetClick(s.instruction)}
                disabled={isGenerating}
                className="w-full text-left p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors group"
                title={s.instruction}
              >
                <p className="text-sm font-medium text-amber-800 group-hover:text-amber-900">→ {s.title}</p>
                {s.description && <p className="text-xs text-amber-600 mt-0.5">{s.description}</p>}
              </button>
            ))}
            <p className="text-[11px] text-slate-400">點選建議會帶入改造指令，可再自行修改</p>
          </div>
        )}
      </div>

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
              title={preset.value}
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
              title={preset.value}
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

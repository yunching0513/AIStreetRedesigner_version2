import React from 'react';
import { StreetSuggestion } from '../types';

interface AISuggestionsProps {
  suggestions: StreetSuggestion[];
  isAnalyzing: boolean;
  onPick: (suggestion: StreetSuggestion) => void;
  disabled?: boolean;
}

export const AISuggestions: React.FC<AISuggestionsProps> = ({
  suggestions,
  isAnalyzing,
  onPick,
  disabled,
}) => {
  if (!isAnalyzing && suggestions.length === 0) return null;

  return (
    <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold">
          AI
        </span>
        <h4 className="text-sm font-semibold text-amber-900">
          {isAnalyzing ? 'AI 正在觀察這條街…' : 'AI 看到的問題'}
        </h4>
      </div>

      {isAnalyzing && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-14 rounded-lg bg-amber-100/60 animate-pulse"
            />
          ))}
        </div>
      )}

      {!isAnalyzing && suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onPick(s)}
              disabled={disabled}
              className="w-full text-left p-3 rounded-lg bg-white hover:bg-amber-50 border border-amber-200 hover:border-amber-400 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full mt-0.5">
                  {s.title}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {s.problem}
              </p>
              <div className="mt-2 text-xs text-amber-700 opacity-0 group-hover:opacity-100 transition-opacity">
                點擊套用此建議 →
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

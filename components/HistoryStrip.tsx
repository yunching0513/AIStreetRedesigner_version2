import React from 'react';
import { HistoryEntry } from '../types';

interface HistoryStripProps {
  history: HistoryEntry[];
  currentIndex: number;
  onJump: (index: number) => void;
}

export const HistoryStrip: React.FC<HistoryStripProps> = ({
  history,
  currentIndex,
  onJump,
}) => {
  if (history.length <= 1) return null;

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-slate-800">改造歷程</h4>
        <span className="text-xs text-slate-500">{history.length} 個版本</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {history.map((entry, i) => {
          const isCurrent = i === currentIndex;
          const isOriginal = i === 0;
          return (
            <button
              key={entry.timestamp}
              onClick={() => onJump(i)}
              className={`flex-shrink-0 w-24 group relative rounded-lg overflow-hidden border-2 transition-all ${
                isCurrent
                  ? 'border-indigo-600 ring-2 ring-indigo-200'
                  : 'border-slate-200 hover:border-indigo-400'
              }`}
              title={entry.prompt}
            >
              <div className="aspect-video bg-slate-100">
                <img
                  src={entry.image}
                  alt={entry.prompt}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute top-1 left-1 bg-slate-900/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                {isOriginal ? '原圖' : `第 ${i} 版`}
              </div>
              {isCurrent && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-white" />
              )}
              <div className="px-1.5 py-1 bg-white">
                <div className="text-[10px] text-slate-600 line-clamp-2 leading-tight">
                  {isOriginal ? '原始照片' : entry.prompt}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

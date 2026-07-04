import React from 'react';
import { HistoryEntry } from '../types';

interface HistoryPanelProps {
  entries: HistoryEntry[];
  activeImage: string | null;
  onSelect: (entry: HistoryEntry) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ entries, activeImage, onSelect }) => {
  if (entries.length === 0) return null;

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
      <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        歷史版本
        <span className="text-xs font-normal text-slate-400">（點縮圖可回顧，本次瀏覽期間保留）</span>
      </h4>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {entries.map((entry) => {
          const isActive = entry.image === activeImage;
          return (
            <button
              key={entry.id}
              onClick={() => onSelect(entry)}
              title={entry.prompt}
              className={`flex-shrink-0 group text-left focus:outline-none ${
                isActive ? '' : 'opacity-80 hover:opacity-100'
              }`}
            >
              <div
                className={`w-28 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                  isActive ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200 group-hover:border-indigo-300'
                }`}
              >
                <img src={entry.image} alt={entry.prompt} className="w-full h-full object-cover" />
              </div>
              <p className="mt-1 text-[11px] text-slate-400 w-28 truncate">
                {new Date(entry.createdAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                {' · '}
                {entry.prompt}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

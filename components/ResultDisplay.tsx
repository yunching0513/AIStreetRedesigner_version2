import React from 'react';
import { BeforeAfterSlider } from './BeforeAfterSlider';

interface ResultDisplayProps {
  originalImage: string;
  currentImage: string | null;
  hasResult: boolean;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({
  originalImage,
  currentImage,
  hasResult,
}) => {
  if (!hasResult || !currentImage) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-slate-800">等待生成結果</h3>
        <p className="text-slate-500 mt-2 max-w-xs">
          選一個 AI 建議或自訂指令，然後按下「生成 3 個方案」。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
        <BeforeAfterSlider
          beforeImage={originalImage}
          afterImage={currentImage}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500 px-1">
          ← 拖曳中央分隔線比對改造前後 →
        </div>
        <a
          href={currentImage}
          download="street-scaper-result.png"
          className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          下載
        </a>
      </div>
    </div>
  );
};

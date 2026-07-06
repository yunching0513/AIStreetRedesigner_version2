import React, { useCallback, useRef, useState } from 'react';

interface ResultDisplayProps {
  originalImage: string;
  generatedImage: string | null;
  canRegenerate: boolean;
  onRegenerate: () => void;
  onContinueEdit: () => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({
  originalImage,
  generatedImage,
  canRegenerate,
  onRegenerate,
  onContinueEdit,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [sliderPos, setSliderPos] = useState(50);

  const updateSlider = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const pos = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.min(100, Math.max(0, pos)));
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      draggingRef.current = true;
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      updateSlider(e.clientX);
    },
    [updateSlider]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      updateSlider(e.clientX);
    },
    [updateSlider]
  );

  const handlePointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  if (!generatedImage) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
           </svg>
        </div>
        <h3 className="text-xl font-semibold text-slate-800">等待生成結果</h3>
        <p className="text-slate-500 mt-2 max-w-xs">請在右側選擇或輸入改造指令，然後點擊「開始改造」。</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
        {/* Before/After 滑桿比較：拖曳分割線對照改造前後 */}
        <div
          ref={containerRef}
          className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 select-none touch-none cursor-ew-resize"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <img
            src={generatedImage}
            alt="Generated View"
            className="absolute inset-0 w-full h-full object-cover animate-fade-in"
            draggable={false}
          />
          <img
            src={originalImage}
            alt="Original View"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            draggable={false}
          />

          {/* 分割線與把手 */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_rgba(0,0,0,0.4)] -translate-x-1/2 pointer-events-none"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l-4 5 4 5M16 7l4 5-4 5" />
              </svg>
            </div>
          </div>

          <div className="absolute top-4 left-4 bg-slate-900/70 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg pointer-events-none">
            改造前 (Before)
          </div>
          <div className="absolute top-4 right-4 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg pointer-events-none">
            改造後 (After)
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 py-2">← 拖曳分割線比較改造前後 →</p>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
          <button
            onClick={onRegenerate}
            disabled={!canRegenerate}
            className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm disabled:opacity-40 disabled:hover:text-slate-700"
            title="用相同指令與圈選範圍再生成一次"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            重新生成
          </button>
          <button
            onClick={onContinueEdit}
            className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm"
            title="把這張結果當作新的底圖，重新圈選並繼續改造"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            繼續編輯這張
          </button>
          <a
            href={generatedImage}
            download="street-scaper-result.png"
            className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            下載圖片
          </a>
      </div>
    </div>
  );
};

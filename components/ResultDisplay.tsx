import React from 'react';

interface ResultDisplayProps {
  originalImage: string;
  generatedImage: string | null;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ originalImage, generatedImage }) => {
  if (!generatedImage) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
           </svg>
        </div>
        <h3 className="text-xl font-semibold text-slate-800">等待生成結果</h3>
        <p className="text-slate-500 mt-2 max-w-xs">請在左側選擇或輸入改造指令，然後點擊「開始改造」。</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100">
          <img 
            src={generatedImage} 
            alt="Generated View" 
            className="w-full h-full object-cover animate-fade-in"
          />
           <div className="absolute top-4 right-4 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            改造後 (After)
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
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
import React from 'react';
import { VariantSlot } from '../types';

interface VariantSelectorProps {
  variants: VariantSlot[];
  prompt: string | null;
  onSelect: (image: string) => void;
  onRetry: () => void;
}

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants,
  prompt,
  onSelect,
  onRetry,
}) => {
  const allDone = variants.every((v) => v.status !== 'pending');
  const successCount = variants.filter((v) => v.status === 'done').length;

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            {allDone ? '挑一個你最喜歡的方案' : `生成中… (${successCount}/${variants.length})`}
          </h3>
          {prompt && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              指令：{prompt}
            </p>
          )}
        </div>
        {allDone && (
          <button
            onClick={onRetry}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded-md hover:bg-indigo-50 transition-colors whitespace-nowrap"
          >
            重新生成
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {variants.map((v, i) => (
          <VariantTile key={i} index={i} slot={v} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
};

interface VariantTileProps {
  index: number;
  slot: VariantSlot;
  onSelect: (image: string) => void;
}

const VariantTile: React.FC<VariantTileProps> = ({ index, slot, onSelect }) => {
  const base = "relative aspect-video rounded-xl overflow-hidden border-2 transition-all";

  if (slot.status === 'pending') {
    return (
      <div
        className={`${base} border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse flex items-center justify-center`}
      >
        <div className="text-xs text-slate-500 font-medium">方案 {index + 1}</div>
      </div>
    );
  }

  if (slot.status === 'error') {
    return (
      <div
        className={`${base} border-red-200 bg-red-50 flex flex-col items-center justify-center p-3 text-center`}
      >
        <div className="text-xs text-red-600 font-medium">方案 {index + 1} 失敗</div>
        <div className="text-[10px] text-red-500 mt-1 line-clamp-2">{slot.error}</div>
      </div>
    );
  }

  return (
    <button
      onClick={() => slot.image && onSelect(slot.image)}
      className={`${base} border-transparent hover:border-indigo-500 hover:shadow-lg hover:-translate-y-0.5 group cursor-pointer`}
    >
      <img
        src={slot.image}
        alt={`Variant ${index + 1}`}
        className="w-full h-full object-cover"
      />
      <div className="absolute top-2 left-2 bg-slate-900/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
        方案 {index + 1}
      </div>
      <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors flex items-end justify-center p-3">
        <div className="bg-white text-indigo-600 text-xs font-bold px-3 py-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
          選這個 →
        </div>
      </div>
    </button>
  );
};

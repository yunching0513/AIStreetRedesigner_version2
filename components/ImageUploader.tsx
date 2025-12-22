import React, { ChangeEvent, useCallback, useRef } from 'react';

interface ImageUploaderProps {
  onImageSelect: (base64: string) => void;
  selectedImage: string | null;
  onReset: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, selectedImage, onReset }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      onImageSelect(result);
    };
    reader.readAsDataURL(file);
  }, [onImageSelect]);

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  if (selectedImage) {
    return (
      <div className="relative group w-full h-64 md:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-md bg-slate-100 border border-slate-200">
        <img 
          src={selectedImage} 
          alt="Original Street View" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
          <button 
            onClick={triggerUpload}
            className="px-4 py-2 bg-white text-slate-900 rounded-lg font-medium hover:bg-slate-50 transition-colors transform hover:scale-105"
          >
            更換照片
          </button>
          <button 
            onClick={onReset}
            className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors transform hover:scale-105"
          >
            重新開始
          </button>
        </div>
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
        />
      </div>
    );
  }

  return (
    <div 
      onClick={triggerUpload}
      className="w-full h-64 border-2 border-dashed border-indigo-200 rounded-2xl bg-indigo-50/30 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-300 group"
    >
      <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <p className="text-lg font-medium text-slate-700">點擊上傳圖片</p>
      <p className="text-sm text-slate-500 mt-1">支援 JPG, PNG</p>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
};
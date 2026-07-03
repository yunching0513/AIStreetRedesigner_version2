import React, { ChangeEvent, useCallback, useRef, useState } from 'react';
import { fileToCompressedDataUrl } from '../utils/imageUtils';

interface ImageUploaderProps {
  onImageSelect: (base64: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      onImageSelect(dataUrl);
    } catch (error) {
      console.error('Image processing failed:', error);
    } finally {
      setIsProcessing(false);
      event.target.value = '';
    }
  }, [onImageSelect]);

  const triggerUpload = () => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  };

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
      <p className="text-lg font-medium text-slate-700">
        {isProcessing ? '圖片處理中...' : '點擊上傳圖片'}
      </p>
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

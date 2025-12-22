import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { PromptPanel } from './components/PromptPanel';
import { ResultDisplay } from './components/ResultDisplay';
import { editStreetImage } from './services/geminiService';
import { LoadingSpinner } from './components/LoadingSpinner';
import { AppState, GeneratedImageResult } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    originalImage: null,
    generatedImage: null,
    isGenerating: false,
    error: null,
  });

  const [promptText, setPromptText] = useState<string>('');

  const handleImageSelect = useCallback((base64Image: string) => {
    setState((prev) => ({
      ...prev,
      originalImage: base64Image,
      generatedImage: null,
      error: null,
    }));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!state.originalImage || !promptText.trim()) return;

    setState((prev) => ({ ...prev, isGenerating: true, error: null }));

    try {
      const result: GeneratedImageResult = await editStreetImage(
        state.originalImage,
        promptText
      );

      if (result.imageUrl) {
        setState((prev) => ({
          ...prev,
          generatedImage: result.imageUrl,
          isGenerating: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          error: '未能生成圖片，請稍後再試。',
        }));
      }
    } catch (error) {
      console.error('Generation failed:', error);
      setState((prev) => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : '發生未知錯誤',
      }));
    }
  }, [state.originalImage, promptText]);

  const handleReset = useCallback(() => {
    setState({
      originalImage: null,
      generatedImage: null,
      isGenerating: false,
      error: null,
    });
    setPromptText('');
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        <div className="space-y-8">
          
          {/* Step 1: Upload */}
          <section className={`transition-all duration-500 ${state.originalImage ? '' : 'flex-grow flex flex-col justify-center'}`}>
            {!state.originalImage && (
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">上傳街景照片</h2>
                <p className="text-slate-500">開始您的城市改造計畫</p>
              </div>
            )}
            <ImageUploader 
              onImageSelect={handleImageSelect} 
              selectedImage={state.originalImage}
              onReset={handleReset}
            />
          </section>

          {/* Step 2 & 3: Prompt & Result */}
          {state.originalImage && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in-up">
              
              {/* Left Column: Controls */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    改造建議
                  </h3>
                  
                  <PromptPanel 
                    promptText={promptText} 
                    setPromptText={setPromptText} 
                    isGenerating={state.isGenerating}
                    onGenerate={handleGenerate}
                  />

                  {state.error && (
                    <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                      {state.error}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Results */}
              <div className="lg:col-span-8">
                {state.isGenerating ? (
                   <div className="h-96 flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100">
                      <LoadingSpinner />
                      <p className="mt-4 text-slate-600 animate-pulse">Gemini 正在重新設計街道...</p>
                      <p className="text-xs text-slate-400 mt-2">使用 Nano Banana 模型</p>
                   </div>
                ) : (
                  <ResultDisplay 
                    originalImage={state.originalImage}
                    generatedImage={state.generatedImage}
                  />
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      <footer className="bg-white border-t border-slate-100 py-6 text-center text-slate-400 text-sm">
        <p>© 2024 StreetScaper AI. Powered by Google Gemini 2.5 Flash Image.</p>
      </footer>
    </div>
  );
};

export default App;
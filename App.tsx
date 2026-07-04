import React, { useState, useCallback, useRef, useEffect, ChangeEvent } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { MaskEditor } from './components/MaskEditor';
import { VideoGenerator } from './components/VideoGenerator';
import { PromptPanel } from './components/PromptPanel';
import { ResultDisplay } from './components/ResultDisplay';
import { HistoryPanel } from './components/HistoryPanel';
import { editStreetImage } from './services/geminiService';
import { LoadingSpinner } from './components/LoadingSpinner';
import { AppState, GeneratedImageResult, HistoryEntry } from './types';
import { fileToCompressedDataUrl } from './utils/imageUtils';

const HISTORY_STORAGE_KEY = 'streetscaper-history';
const MAX_HISTORY = 8;

const loadHistory = (): HistoryEntry[] => {
  try {
    const raw = sessionStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    originalImage: null,
    maskImage: null,
    generatedImage: null,
    isGenerating: false,
    error: null,
  });

  const [promptText, setPromptText] = useState<string>('');
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const changeFileInputRef = useRef<HTMLInputElement>(null);

  // 歷史版本存到 sessionStorage（本次瀏覽期間保留）；
  // 圖片為 base64 體積較大，超過配額時放棄持久化但不影響畫面上的列表。
  useEffect(() => {
    try {
      sessionStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch {
      // QuotaExceededError：忽略，僅保留記憶體中的歷史
    }
  }, [history]);

  const handleImageSelect = useCallback((base64Image: string) => {
    setState((prev) => ({
      ...prev,
      originalImage: base64Image,
      maskImage: null,
      generatedImage: null,
      error: null,
    }));
  }, []);

  const handleChangeFile = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      handleImageSelect(dataUrl);
    } catch (error) {
      console.error('Image processing failed:', error);
    } finally {
      event.target.value = '';
    }
  }, [handleImageSelect]);

  const handleMaskChange = useCallback((maskDataUrl: string | null) => {
    setState((prev) => ({ ...prev, maskImage: maskDataUrl }));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!state.originalImage || !promptText.trim()) return;

    setState((prev) => ({ ...prev, isGenerating: true, error: null }));

    try {
      const result: GeneratedImageResult = await editStreetImage(
        state.originalImage,
        promptText,
        state.maskImage
      );

      if (result.imageUrl) {
        setState((prev) => ({
          ...prev,
          generatedImage: result.imageUrl,
          isGenerating: false,
        }));
        setHistory((prev) =>
          [
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              image: result.imageUrl!,
              prompt: promptText,
              createdAt: Date.now(),
            },
            ...prev,
          ].slice(0, MAX_HISTORY)
        );
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
  }, [state.originalImage, state.maskImage, promptText]);

  // 以本次結果為新底圖繼續改造；MaskEditor 會因 imageSrc 改變自動清空圈選
  const handleContinueEdit = useCallback(() => {
    setState((prev) => {
      if (!prev.generatedImage) return prev;
      return {
        ...prev,
        originalImage: prev.generatedImage,
        maskImage: null,
        generatedImage: null,
        error: null,
      };
    });
    setPromptText('');
  }, []);

  const handleSelectHistory = useCallback((entry: HistoryEntry) => {
    setState((prev) => ({ ...prev, generatedImage: entry.image, error: null }));
  }, []);

  const handleReset = useCallback(() => {
    setState({
      originalImage: null,
      maskImage: null,
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
          {!state.originalImage && (
            <section className="flex-grow flex flex-col justify-center">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">上傳街景照片</h2>
                <p className="text-slate-500">開始您的城市改造計畫</p>
              </div>
              <ImageUploader onImageSelect={handleImageSelect} />
            </section>
          )}

          {/* Step 2 & 3: Annotate, Prompt & Result */}
          {state.originalImage && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in-up">

              {/* Left Column: Image annotation */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485" />
                    </svg>
                    圈選改善區域
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => changeFileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-sm rounded-lg font-medium hover:bg-slate-50 transition-colors"
                      disabled={state.isGenerating}
                    >
                      更換照片
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-3 py-1.5 bg-white border border-red-200 text-red-600 text-sm rounded-lg font-medium hover:bg-red-50 transition-colors"
                      disabled={state.isGenerating}
                    >
                      重新開始
                    </button>
                    <input
                      type="file"
                      ref={changeFileInputRef}
                      onChange={handleChangeFile}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>

                <MaskEditor
                  imageSrc={state.originalImage}
                  disabled={state.isGenerating}
                  onMaskChange={handleMaskChange}
                />

                {/* Result area */}
                {state.isGenerating ? (
                  <div className="h-96 flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100">
                    <LoadingSpinner />
                    <p className="mt-4 text-slate-600 animate-pulse">
                      {state.maskImage ? 'Gemini 正在改造圈選區域...' : 'Gemini 正在重新設計街道...'}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">使用 Nano Banana 模型</p>
                  </div>
                ) : (
                  <>
                    <ResultDisplay
                      originalImage={state.originalImage}
                      generatedImage={state.generatedImage}
                      canRegenerate={!!promptText.trim()}
                      onRegenerate={handleGenerate}
                      onContinueEdit={handleContinueEdit}
                    />
                    <HistoryPanel
                      entries={history}
                      activeImage={state.generatedImage}
                      onSelect={handleSelectHistory}
                    />
                    {state.generatedImage && (
                      <VideoGenerator
                        key={state.generatedImage.slice(-64)}
                        originalImage={state.originalImage}
                        generatedImage={state.generatedImage}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Right Column: Controls */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    改造建議
                  </h3>

                  {state.maskImage && (
                    <div className="mb-4 p-2.5 bg-indigo-50 text-indigo-700 text-xs rounded-lg border border-indigo-100 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      已圈選區域，改造將只套用在標記範圍內
                    </div>
                  )}

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
            </div>
          )}

        </div>
      </main>

      <footer className="bg-white border-t border-slate-100 py-6 text-center text-slate-400 text-sm">
        <p>© 2024 StreetScaper AI. Powered by Google Gemini 2.5 Flash Image & Veo.</p>
      </footer>
    </div>
  );
};

export default App;

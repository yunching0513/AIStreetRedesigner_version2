import React, { useCallback, useState } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { PromptPanel } from './components/PromptPanel';
import { ResultDisplay } from './components/ResultDisplay';
import { AISuggestions } from './components/AISuggestions';
import { VariantSelector } from './components/VariantSelector';
import { HistoryStrip } from './components/HistoryStrip';
import {
  analyzeStreetImage,
  generateVariants,
} from './services/geminiService';
import { AppState, HistoryEntry, StreetSuggestion } from './types';

const VARIANT_COUNT = 3;

const initialState: AppState = {
  history: [],
  currentIndex: 0,
  variants: [],
  variantPrompt: null,
  suggestions: [],
  isAnalyzing: false,
  isGenerating: false,
  error: null,
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(initialState);
  const [promptText, setPromptText] = useState<string>('');
  const [iterateFromCurrent, setIterateFromCurrent] = useState<boolean>(true);

  const originalImage = state.history[0]?.image ?? null;
  const currentImage = state.history[state.currentIndex]?.image ?? null;
  const hasResult = state.history.length > 1;

  const handleImageSelect = useCallback(async (base64Image: string) => {
    const firstEntry: HistoryEntry = {
      image: base64Image,
      prompt: '原始照片',
      timestamp: Date.now(),
    };
    setState({
      ...initialState,
      history: [firstEntry],
      currentIndex: 0,
      isAnalyzing: true,
    });
    setPromptText('');

    try {
      const suggestions = await analyzeStreetImage(base64Image);
      setState((prev) => ({ ...prev, suggestions, isAnalyzing: false }));
    } catch (e) {
      console.error('Analyze failed', e);
      setState((prev) => ({
        ...prev,
        isAnalyzing: false,
        suggestions: [],
      }));
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!promptText.trim()) return;
    const sourceImage = iterateFromCurrent
      ? currentImage ?? originalImage
      : originalImage;
    if (!sourceImage) return;

    const prompt = promptText;
    setState((prev) => ({
      ...prev,
      isGenerating: true,
      error: null,
      variantPrompt: prompt,
      variants: Array.from({ length: VARIANT_COUNT }, () => ({
        status: 'pending' as const,
      })),
    }));

    try {
      await generateVariants(sourceImage, prompt, VARIANT_COUNT, (i, slot) => {
        setState((prev) => {
          const next = [...prev.variants];
          next[i] = slot;
          return { ...prev, variants: next };
        });
      });
    } catch (e) {
      console.error('Generation failed:', e);
      setState((prev) => ({
        ...prev,
        error: e instanceof Error ? e.message : '生成失敗',
      }));
    } finally {
      setState((prev) => ({ ...prev, isGenerating: false }));
    }
  }, [promptText, iterateFromCurrent, currentImage, originalImage]);

  const handleSelectVariant = useCallback(
    (image: string) => {
      setState((prev) => {
        const newEntry: HistoryEntry = {
          image,
          prompt: prev.variantPrompt ?? '',
          timestamp: Date.now(),
        };
        const truncated = prev.history.slice(0, prev.currentIndex + 1);
        const nextHistory = [...truncated, newEntry];
        return {
          ...prev,
          history: nextHistory,
          currentIndex: nextHistory.length - 1,
          variants: [],
          variantPrompt: null,
        };
      });
      setPromptText('');
    },
    []
  );

  const handleRetryVariants = useCallback(() => {
    handleGenerate();
  }, [handleGenerate]);

  const handleJumpHistory = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      currentIndex: index,
      variants: [],
      variantPrompt: null,
    }));
  }, []);

  const handlePickSuggestion = useCallback((suggestion: StreetSuggestion) => {
    setPromptText(suggestion.prompt);
  }, []);

  const handleReset = useCallback(() => {
    setState(initialState);
    setPromptText('');
  }, []);

  const handleResetToOriginal = useCallback(() => {
    setState((prev) => ({ ...prev, currentIndex: 0, variants: [], variantPrompt: null }));
  }, []);

  const showVariants = state.variants.length > 0;
  const promptLabel = hasResult && iterateFromCurrent
    ? '繼續編輯目前的結果'
    : '自訂改造指令';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-8">
          <section
            className={`transition-all duration-500 ${
              originalImage ? '' : 'flex-grow flex flex-col justify-center'
            }`}
          >
            {!originalImage && (
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">
                  上傳街景照片
                </h2>
                <p className="text-slate-500">
                  讓 AI 觀察這條街，並提出改造建議
                </p>
              </div>
            )}
            <ImageUploader
              onImageSelect={handleImageSelect}
              selectedImage={originalImage}
              onReset={handleReset}
            />
          </section>

          {originalImage && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in-up">
              <div className="lg:col-span-4 space-y-4">
                <AISuggestions
                  suggestions={state.suggestions}
                  isAnalyzing={state.isAnalyzing}
                  onPick={handlePickSuggestion}
                  disabled={state.isGenerating}
                />

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 sticky top-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-indigo-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    改造指令
                  </h3>

                  {hasResult && (
                    <div className="mb-4 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <label className="flex items-center justify-between gap-3 cursor-pointer">
                        <div>
                          <div className="text-xs font-semibold text-slate-700">
                            從目前結果繼續編輯
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            關掉的話會從原圖重新生成
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={iterateFromCurrent}
                          onChange={(e) =>
                            setIterateFromCurrent(e.target.checked)
                          }
                          className="w-4 h-4 accent-indigo-600"
                        />
                      </label>
                    </div>
                  )}

                  <PromptPanel
                    promptText={promptText}
                    setPromptText={setPromptText}
                    isGenerating={state.isGenerating}
                    onGenerate={handleGenerate}
                    iterationLabel={promptLabel}
                  />

                  {state.error && (
                    <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                      {state.error}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-8 space-y-4">
                {showVariants && (
                  <VariantSelector
                    variants={state.variants}
                    prompt={state.variantPrompt}
                    onSelect={handleSelectVariant}
                    onRetry={handleRetryVariants}
                  />
                )}

                <ResultDisplay
                  originalImage={originalImage}
                  currentImage={currentImage}
                  hasResult={hasResult}
                />

                <HistoryStrip
                  history={state.history}
                  currentIndex={state.currentIndex}
                  onJump={handleJumpHistory}
                />

                {hasResult && state.currentIndex !== 0 && (
                  <div className="flex justify-end">
                    <button
                      onClick={handleResetToOriginal}
                      className="text-xs font-medium text-slate-500 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
                    >
                      ↺ 回到原圖
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-100 py-6 text-center text-slate-400 text-sm">
        <p>© 2024 StreetScaper AI · Powered by Google Gemini 2.5 Flash Image</p>
      </footer>
    </div>
  );
};

export default App;

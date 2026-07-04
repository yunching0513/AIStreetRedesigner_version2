import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createComparisonVideo } from '../utils/videoUtils';
import { generateStreetVideo } from '../services/geminiService';

interface VideoGeneratorProps {
  originalImage: string;
  generatedImage: string;
}

type VideoStatus = 'idle' | 'working' | 'done' | 'error';

interface VideoState {
  status: VideoStatus;
  url: string | null;
  error: string | null;
}

const IDLE_STATE: VideoState = { status: 'idle', url: null, error: null };

const DEFAULT_VEO_PROMPT =
  'Slow cinematic dolly shot moving forward along this redesigned street. Pedestrians walking naturally, gentle daylight, ambient city sounds. Keep the scene exactly as shown in the image.';

const VideoPlayer: React.FC<{ url: string; filename: string; mimeHint: string }> = ({ url, filename, mimeHint }) => (
  <div className="space-y-2">
    <video src={url} controls loop className="w-full rounded-xl bg-slate-900" />
    <div className="flex justify-end">
      <a
        href={url}
        download={filename}
        className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        下載影片（{mimeHint}）
      </a>
    </div>
  </div>
);

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({ originalImage, generatedImage }) => {
  const [comparison, setComparison] = useState<VideoState>(IDLE_STATE);
  const [veo, setVeo] = useState<VideoState>(IDLE_STATE);
  const [veoPrompt, setVeoPrompt] = useState(DEFAULT_VEO_PROMPT);
  const [veoProgress, setVeoProgress] = useState('');
  const urlsRef = useRef<string[]>([]);

  // 元件卸載時釋放 blob URL
  useEffect(() => {
    return () => {
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const handleComparison = useCallback(async () => {
    setComparison({ status: 'working', url: null, error: null });
    try {
      const blob = await createComparisonVideo(originalImage, generatedImage);
      const url = URL.createObjectURL(blob);
      urlsRef.current.push(url);
      setComparison({ status: 'done', url, error: null });
    } catch (error) {
      setComparison({
        status: 'error',
        url: null,
        error: error instanceof Error ? error.message : '對比影片製作失敗',
      });
    }
  }, [originalImage, generatedImage]);

  const handleVeo = useCallback(async () => {
    if (!veoPrompt.trim()) return;
    setVeo({ status: 'working', url: null, error: null });
    setVeoProgress('準備中...');
    try {
      const url = await generateStreetVideo(generatedImage, veoPrompt, setVeoProgress);
      urlsRef.current.push(url);
      setVeo({ status: 'done', url, error: null });
    } catch (error) {
      setVeo({
        status: 'error',
        url: null,
        error: error instanceof Error ? error.message : 'AI 影片生成失敗',
      });
    }
  }, [generatedImage, veoPrompt]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
      <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        影片化成果
      </h3>

      {/* 方案一：前端合成前後對比影片 */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-700">快速對比影片</p>
            <p className="text-xs text-slate-400 mt-0.5">
              改造前 → 改造後的擦拭轉場動畫，於瀏覽器即時合成，不消耗 API 額度。
            </p>
          </div>
          <button
            onClick={handleComparison}
            disabled={comparison.status === 'working'}
            className="flex-shrink-0 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium rounded-lg border border-indigo-200 transition-colors disabled:opacity-50"
          >
            {comparison.status === 'working' ? '合成中...' : comparison.status === 'done' ? '重新合成' : '製作影片'}
          </button>
        </div>
        {comparison.status === 'error' && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5">{comparison.error}</p>
        )}
        {comparison.url && (
          <VideoPlayer url={comparison.url} filename="street-scaper-comparison.webm" mimeHint="WebM" />
        )}
      </div>

      <hr className="border-slate-100" />

      {/* 方案二：Veo AI 動態影片 */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-slate-700">AI 動態影片（Veo）</p>
          <p className="text-xs text-slate-400 mt-0.5">
            以改造後的圖片為首幀，由 Google Veo 生成約 8 秒的動態運鏡影片（含環境音）。
            需使用已啟用計費的 API 金鑰，生成約需 1〜3 分鐘。
          </p>
        </div>
        <textarea
          value={veoPrompt}
          onChange={(e) => setVeoPrompt(e.target.value)}
          placeholder="描述想要的鏡頭運動與街道氛圍（建議英文）..."
          className="w-full h-20 p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none bg-slate-50"
          disabled={veo.status === 'working'}
        />
        <button
          onClick={handleVeo}
          disabled={veo.status === 'working' || !veoPrompt.trim()}
          className={`w-full py-2.5 px-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
            veo.status === 'working' || !veoPrompt.trim()
              ? 'bg-slate-300 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-purple-500/30 hover:-translate-y-0.5 active:translate-y-0'
          }`}
        >
          {veo.status === 'working' ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {veoProgress || '生成中...'}
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
              {veo.status === 'done' ? '重新生成 AI 影片' : '生成 AI 影片'}
            </>
          )}
        </button>
        {veo.status === 'error' && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5">{veo.error}</p>
        )}
        {veo.url && (
          <VideoPlayer url={veo.url} filename="street-scaper-veo.mp4" mimeHint="MP4" />
        )}
      </div>
    </div>
  );
};

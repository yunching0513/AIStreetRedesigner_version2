import React, { useCallback, useEffect, useRef, useState } from 'react';

type Tool = 'brush' | 'rect' | 'eraser';

interface Point {
  x: number;
  y: number;
}

interface StrokeShape {
  kind: 'stroke';
  erase: boolean;
  size: number;
  points: Point[];
}

interface RectShape {
  kind: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
}

type Shape = StrokeShape | RectShape;

interface MaskEditorProps {
  imageSrc: string;
  disabled: boolean;
  onMaskChange: (maskDataUrl: string | null) => void;
}

const HIGHLIGHT_COLOR = 'rgba(99, 102, 241, 0.5)';

const drawShapes = (ctx: CanvasRenderingContext2D, shapes: Shape[]) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const shape of shapes) {
    if (shape.kind === 'rect') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillRect(shape.x, shape.y, shape.w, shape.h);
    } else {
      ctx.globalCompositeOperation = shape.erase ? 'destination-out' : 'source-over';
      ctx.lineWidth = shape.size;
      ctx.beginPath();
      const [first, ...rest] = shape.points;
      ctx.moveTo(first.x, first.y);
      if (rest.length === 0) {
        ctx.lineTo(first.x + 0.01, first.y + 0.01);
      } else {
        for (const p of rest) ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
  }
  ctx.globalCompositeOperation = 'source-over';
};

export const MaskEditor: React.FC<MaskEditorProps> = ({ imageSrc, disabled, onMaskChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  // 進行中的筆劃以 ref 為準（state 僅供重繪），避免在 state updater 內
  // 連鎖呼叫 setState —— StrictMode 雙重呼叫會導致形狀被提交兩次。
  const activeShapeRef = useRef<Shape | null>(null);

  const [tool, setTool] = useState<Tool>('brush');
  const [brushSize, setBrushSize] = useState(36);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [activeShape, setActiveShape] = useState<Shape | null>(null);
  const [imageSize, setImageSize] = useState<{ w: number; h: number } | null>(null);

  // 載入圖片取得原始尺寸，canvas 內部解析度與圖片像素一一對應，
  // 確保圈選座標不會因縮放顯示而偏移。
  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = imageSrc;
    setShapes([]);
    setActiveShape(null);
  }, [imageSrc]);

  // 重繪高亮圖層：先在離屏 canvas 畫出白色遮罩，再染成半透明 indigo。
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSize) return;

    if (!maskCanvasRef.current) {
      maskCanvasRef.current = document.createElement('canvas');
    }
    const maskCanvas = maskCanvasRef.current;
    maskCanvas.width = imageSize.w;
    maskCanvas.height = imageSize.h;
    const maskCtx = maskCanvas.getContext('2d');
    const ctx = canvas.getContext('2d');
    if (!maskCtx || !ctx) return;

    const allShapes = activeShape ? [...shapes, activeShape] : shapes;
    drawShapes(maskCtx, allShapes);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(maskCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = HIGHLIGHT_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
  }, [shapes, activeShape, imageSize]);

  // 確定的圈選內容改變時，匯出黑底白區的遮罩圖給上層。
  useEffect(() => {
    if (!imageSize) return;
    const hasMarkedArea = shapes.some(
      (s) => s.kind === 'rect' || !s.erase
    );
    if (!hasMarkedArea) {
      onMaskChange(null);
      return;
    }
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = imageSize.w;
    exportCanvas.height = imageSize.h;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;
    drawShapes(ctx, shapes);
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    onMaskChange(exportCanvas.toDataURL('image/png'));
  }, [shapes, imageSize, onMaskChange]);

  const getImagePoint = useCallback((e: React.PointerEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }, []);

  // 筆刷大小以顯示像素為準，轉換成圖片像素，
  // 讓不同解析度的圖片下筆觸的視覺粗細一致。
  const getScaledBrushSize = useCallback(() => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return brushSize * (canvas.width / rect.width);
  }, [brushSize]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || !imageSize) return;
      e.preventDefault();
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
      drawingRef.current = true;
      const p = getImagePoint(e);
      const shape: Shape =
        tool === 'rect'
          ? { kind: 'rect', x: p.x, y: p.y, w: 0, h: 0 }
          : {
              kind: 'stroke',
              erase: tool === 'eraser',
              size: getScaledBrushSize(),
              points: [p],
            };
      activeShapeRef.current = shape;
      setActiveShape(shape);
    },
    [disabled, imageSize, tool, getImagePoint, getScaledBrushSize]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drawingRef.current) return;
      e.preventDefault();
      const prev = activeShapeRef.current;
      if (!prev) return;
      const p = getImagePoint(e);
      const next: Shape =
        prev.kind === 'rect'
          ? { ...prev, w: p.x - prev.x, h: p.y - prev.y }
          : { ...prev, points: [...prev.points, p] };
      activeShapeRef.current = next;
      setActiveShape(next);
    },
    [getImagePoint]
  );

  const handlePointerUp = useCallback(() => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const shape = activeShapeRef.current;
    activeShapeRef.current = null;
    setActiveShape(null);
    if (!shape) return;
    const normalized: Shape =
      shape.kind === 'rect'
        ? {
            ...shape,
            x: Math.min(shape.x, shape.x + shape.w),
            y: Math.min(shape.y, shape.y + shape.h),
            w: Math.abs(shape.w),
            h: Math.abs(shape.h),
          }
        : shape;
    const isEmptyRect =
      normalized.kind === 'rect' && (normalized.w < 2 || normalized.h < 2);
    if (!isEmptyRect) {
      setShapes((s) => [...s, normalized]);
    }
  }, []);

  const handleUndo = useCallback(() => setShapes((s) => s.slice(0, -1)), []);
  const handleClear = useCallback(() => setShapes([]), []);

  const toolButtonClass = (active: boolean) =>
    `px-3 py-1.5 text-sm rounded-lg border transition-colors flex items-center gap-1.5 ${
      active
        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
    }`;

  const hasSelection = shapes.some((s) => s.kind === 'rect' || !s.erase);

  return (
    <div className="space-y-3">
      {/* 工具列 */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setTool('brush')} className={toolButtonClass(tool === 'brush')} disabled={disabled}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          筆刷
        </button>
        <button onClick={() => setTool('rect')} className={toolButtonClass(tool === 'rect')} disabled={disabled}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect x="4" y="6" width="16" height="12" rx="1" strokeWidth={2} />
          </svg>
          方框
        </button>
        <button onClick={() => setTool('eraser')} className={toolButtonClass(tool === 'eraser')} disabled={disabled}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 15l6-6m-9 9l-2.5-2.5a2 2 0 010-2.828l8.086-8.086a2 2 0 012.828 0L19 9.172a2 2 0 010 2.828L12.828 18H6z" />
          </svg>
          橡皮擦
        </button>

        {tool !== 'rect' && (
          <div className="flex items-center gap-2 ml-1">
            <span className="text-xs text-slate-400">大小</span>
            <input
              type="range"
              min={12}
              max={80}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-24 accent-indigo-600"
              disabled={disabled}
            />
          </div>
        )}

        <div className="flex-grow" />

        <button
          onClick={handleUndo}
          className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
          disabled={disabled || shapes.length === 0}
        >
          復原
        </button>
        <button
          onClick={handleClear}
          className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
          disabled={disabled || shapes.length === 0}
        >
          清除
        </button>
      </div>

      {/* 圖片 + 圈選畫布 */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-md bg-slate-900/5 border border-slate-200">
        <img
          src={imageSrc}
          alt="Original Street View"
          className="w-full h-auto block select-none pointer-events-none"
          draggable={false}
        />
        {imageSize && (
          <canvas
            ref={canvasRef}
            width={imageSize.w}
            height={imageSize.h}
            className={`absolute inset-0 w-full h-full touch-none ${
              disabled ? 'cursor-not-allowed' : 'cursor-crosshair'
            }`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
        )}
      </div>

      <p className="text-xs text-slate-400">
        {hasSelection
          ? '✓ 已圈選改善區域，AI 將只修改標記範圍。可用橡皮擦修整或「清除」重畫。'
          : '（選用）用筆刷或方框圈出想改善的區域；不圈選則會對整張圖進行改造。'}
      </p>
    </div>
  );
};

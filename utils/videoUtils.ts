// 前端合成「改造前 → 改造後」轉場影片：
// 以 canvas 逐幀繪製（定格前 → 擦拭轉場 → 定格後），
// 用 MediaRecorder 錄製 canvas 串流輸出 WebM，全程不需 API。
const WIDTH = 1280;
const HEIGHT = 720;
const FPS = 30;
const HOLD_BEFORE_MS = 1200;
const WIPE_MS = 2200;
const HOLD_AFTER_MS = 1800;
const TOTAL_MS = HOLD_BEFORE_MS + WIPE_MS + HOLD_AFTER_MS;

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('圖片載入失敗'));
    img.src = src;
  });

// 等比例置中填滿（cover），兩張圖尺寸不一時也能對齊
const drawCover = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number
) => {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
};

const drawLabel = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  alpha: number
) => {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = '600 30px Inter, sans-serif';
  const metrics = ctx.measureText(text);
  const padX = 20;
  const padY = 12;
  const w = metrics.width + padX * 2;
  const h = 30 + padY * 2;
  const y = 32;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + padX, y + h / 2 + 2);
  ctx.restore();
};

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const pickMimeType = (): string => {
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  throw new Error('此瀏覽器不支援影片錄製，請改用 Chrome 或 Edge。');
};

export const createComparisonVideo = async (
  originalSrc: string,
  generatedSrc: string
): Promise<Blob> => {
  const [before, after] = await Promise.all([loadImage(originalSrc), loadImage(generatedSrc)]);

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('無法建立繪圖環境');

  const renderFrame = (elapsed: number) => {
    drawCover(ctx, before, WIDTH, HEIGHT);
    const wipeT = Math.min(1, Math.max(0, (elapsed - HOLD_BEFORE_MS) / WIPE_MS));
    const x = WIDTH * easeInOut(wipeT);

    if (x > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, x, HEIGHT);
      ctx.clip();
      drawCover(ctx, after, WIDTH, HEIGHT);
      ctx.restore();

      if (wipeT < 1) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(x - 2, 0, 4, HEIGHT);
      }
    }

    drawLabel(ctx, '改造前 Before', 32, 1 - wipeT);
    drawLabel(ctx, '改造後 After', 32, wipeT);
  };

  renderFrame(0);

  const stream = canvas.captureStream(FPS);
  const recorder = new MediaRecorder(stream, { mimeType: pickMimeType() });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType }));
    recorder.onerror = () => reject(new Error('影片錄製失敗'));
    recorder.start();

    const startTime = performance.now();
    const tick = () => {
      const elapsed = performance.now() - startTime;
      if (elapsed >= TOTAL_MS) {
        renderFrame(TOTAL_MS);
        recorder.stop();
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      renderFrame(elapsed);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
};

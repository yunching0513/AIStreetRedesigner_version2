// 上傳前壓縮：長邊縮至 MAX_DIMENSION，統一輸出 JPEG，
// 可大幅縮小 base64 請求體積並加快生成速度。
const MAX_DIMENSION = 1536;
const JPEG_QUALITY = 0.85;

export const fileToCompressedDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('讀取檔案失敗，請重新選擇圖片。'));
    reader.onload = () => {
      const originalDataUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error('無法解析圖片，請確認檔案格式為 JPG 或 PNG。'));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(originalDataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.src = originalDataUrl;
    };
    reader.readAsDataURL(file);
  });
};

export const parseDataUrl = (
  dataUrl: string
): { mimeType: string; data: string } => {
  const match = dataUrl.match(/^data:(image\/[a-z+.-]+);base64,(.*)$/i);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  return { mimeType: 'image/jpeg', data: dataUrl };
};

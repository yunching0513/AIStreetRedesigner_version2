<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# StreetScaper AI

AI 街道改造工具：上傳街景照片、圈選想改善的區域、輸入改造指令，由 Gemini 生成改造後的街景，並可進一步輸出前後對比影片或 Veo AI 動態影片。

View your app in AI Studio: https://ai.studio/apps/drive/1aH_GAqUJT_elLg1uMlZ6Lnqgo-DxD9fr

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. (選用) Set the `GOOGLE_MAPS_API_KEY` in [.env.local](.env.local) 以啟用「從 Google 地圖選取街景」功能
   （金鑰需啟用 Maps JavaScript API、Street View Static API、Geocoding API，並建議設定 HTTP referrer 限制）
4. Run the app:
   `npm run dev`

API 金鑰只在伺服器端使用（開發時由 Vite 中介層代理 `/api` 請求），不會被打包進前端程式碼。

## Deploy to Vercel

1. 在 [vercel.com/new](https://vercel.com/new) 匯入這個儲存庫（框架會自動偵測為 Vite）
2. 在專案的 Environment Variables 加入 `GEMINI_API_KEY`（及選用的 `GOOGLE_MAPS_API_KEY`）
3. 部署完成後，`api/` 目錄會自動成為 serverless functions，前端透過 `/api/*` 代理呼叫 Gemini，金鑰不會外洩

> 注意：Veo 影片生成需要已啟用計費的 API 金鑰。

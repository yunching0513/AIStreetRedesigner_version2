import React, { useCallback, useEffect, useRef, useState } from 'react';

interface StreetViewPickerProps {
  onSelect: (dataUrl: string) => void;
  onClose: () => void;
}

// 預設中心：台北市
const DEFAULT_CENTER = { lat: 25.033, lng: 121.5654 };
const PANO_SEARCH_RADIUS_M = 80;

declare global {
  interface Window {
    google?: typeof google;
  }
}

let mapsApiPromise: Promise<typeof google> | null = null;

// Maps JavaScript API 需以 script 載入且金鑰隨網址出現，屬 Google 設計上的
// 前端公開金鑰（應在 Cloud Console 以 HTTP referrer 限制保護）。
const loadMapsApi = (apiKey: string): Promise<typeof google> => {
  if (window.google?.maps) return Promise.resolve(window.google);
  if (!mapsApiPromise) {
    mapsApiPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&language=zh-TW`;
      script.async = true;
      script.onload = () => {
        if (window.google?.maps) resolve(window.google);
        else reject(new Error('Google Maps 初始化失敗'));
      };
      script.onerror = () => {
        mapsApiPromise = null;
        reject(new Error('Google Maps 載入失敗，請確認網路與金鑰設定。'));
      };
      document.head.appendChild(script);
    });
  }
  return mapsApiPromise;
};

const zoomToFov = (zoom: number): number => {
  const fov = 180 / Math.pow(2, zoom);
  return Math.min(120, Math.max(10, fov));
};

export const StreetViewPicker: React.FC<StreetViewPickerProps> = ({ onSelect, onClose }) => {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const panoDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const svServiceRef = useRef<google.maps.StreetViewService | null>(null);

  const [status, setStatus] = useState<'loading' | 'ready' | 'unconfigured' | 'failed'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasPano, setHasPano] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const findPanorama = useCallback((latLng: google.maps.LatLng | google.maps.LatLngLiteral) => {
    const service = svServiceRef.current;
    const panorama = panoramaRef.current;
    if (!service || !panorama) return;
    setNotice(null);
    service.getPanorama(
      {
        location: latLng,
        radius: PANO_SEARCH_RADIUS_M,
        source: google.maps.StreetViewSource.OUTDOOR,
      },
      (data, svStatus) => {
        if (svStatus === google.maps.StreetViewStatus.OK && data?.location?.pano) {
          panorama.setPano(data.location.pano);
          panorama.setVisible(true);
          if (data.location.latLng) {
            markerRef.current?.setPosition(data.location.latLng);
            mapRef.current?.setCenter(data.location.latLng);
          }
          setHasPano(true);
        } else {
          setNotice('這個位置附近沒有街景，請點選鄰近的道路。');
        }
      }
    );
  }, []);

  // 初始化：取得金鑰 → 載入 Maps JS → 建立地圖與街景
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const configRes = await fetch('/api/maps-config');
        const config = (await configRes.json().catch(() => null)) as { mapsApiKey?: string | null } | null;
        if (!config?.mapsApiKey) {
          if (!cancelled) setStatus('unconfigured');
          return;
        }
        const g = await loadMapsApi(config.mapsApiKey);
        if (cancelled || !mapDivRef.current || !panoDivRef.current) return;

        const map = new g.maps.Map(mapDivRef.current, {
          center: DEFAULT_CENTER,
          zoom: 16,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });
        const panorama = new g.maps.StreetViewPanorama(panoDivRef.current, {
          visible: false,
          addressControl: false,
          fullscreenControl: false,
        });
        const marker = new g.maps.Marker({ map });

        mapRef.current = map;
        panoramaRef.current = panorama;
        markerRef.current = marker;
        svServiceRef.current = new g.maps.StreetViewService();

        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) findPanorama(e.latLng);
        });

        setStatus('ready');
      } catch (err) {
        if (!cancelled) {
          setStatus('failed');
          setError(err instanceof Error ? err.message : 'Google Maps 載入失敗');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [findPanorama]);

  const handleSearch = useCallback(async () => {
    if (!searchText.trim() || isSearching) return;
    setIsSearching(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(searchText)}`);
      const data = (await response.json().catch(() => null)) as
        | { lat?: number; lng?: number; address?: string; error?: string }
        | null;
      if (!response.ok || data?.lat == null || data?.lng == null) {
        throw new Error(data?.error ?? '地點搜尋失敗');
      }
      const location = { lat: data.lat, lng: data.lng };
      mapRef.current?.setCenter(location);
      mapRef.current?.setZoom(17);
      findPanorama(location);
    } catch (err) {
      setError(err instanceof Error ? err.message : '地點搜尋失敗');
    } finally {
      setIsSearching(false);
    }
  }, [searchText, isSearching, findPanorama]);

  const handleCapture = useCallback(async () => {
    const panorama = panoramaRef.current;
    if (!panorama || isCapturing) return;
    const pano = panorama.getPano();
    if (!pano) return;
    setIsCapturing(true);
    setError(null);
    try {
      const pov = panorama.getPov();
      const fov = zoomToFov(panorama.getZoom() ?? 1);
      const params = new URLSearchParams({
        pano,
        heading: String(((pov.heading % 360) + 360) % 360),
        pitch: String(pov.pitch),
        fov: String(fov),
      });
      const response = await fetch(`/api/streetview?${params.toString()}`);
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? `街景圖擷取失敗 (HTTP ${response.status})`);
      }
      const blob = await response.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('街景圖讀取失敗'));
        reader.readAsDataURL(blob);
      });
      onSelect(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : '街景圖擷取失敗');
      setIsCapturing(false);
    }
  }, [isCapturing, onSelect]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            從 Google 地圖選取街景
          </h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors" aria-label="關閉">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {status === 'unconfigured' && (
          <div className="p-4 bg-amber-50 text-amber-700 text-sm rounded-lg border border-amber-200">
            尚未設定 Google Maps 金鑰。請在環境變數加入 <code className="font-mono bg-amber-100 px-1 rounded">GOOGLE_MAPS_API_KEY</code>（需啟用 Maps JavaScript API、Street View Static API 與 Geocoding API）。
          </div>
        )}
        {status === 'failed' && (
          <div className="p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>
        )}

        {(status === 'ready' || status === 'loading') && (
          <>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="搜尋地點，例如：台北市信義路五段..."
                className="flex-grow p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-slate-50"
                disabled={status !== 'ready'}
              />
              <button
                onClick={handleSearch}
                disabled={status !== 'ready' || isSearching || !searchText.trim()}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isSearching ? '搜尋中...' : '搜尋'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500">1. 點選地圖上的道路</p>
                <div ref={mapDivRef} className="h-72 rounded-xl bg-slate-100 border border-slate-200" data-testid="map" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500">2. 拖曳街景調整視角</p>
                <div className="relative h-72 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden">
                  <div ref={panoDivRef} className="absolute inset-0" data-testid="pano" />
                  {!hasPano && (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400 pointer-events-none">
                      {status === 'loading' ? '地圖載入中...' : '尚未選取街景位置'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {notice && (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5">{notice}</p>
            )}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5">{error}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCapture}
                disabled={!hasPano || isCapturing}
                className={`px-5 py-2 rounded-lg text-sm font-bold text-white transition-all ${
                  !hasPano || isCapturing
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/30'
                }`}
              >
                {isCapturing ? '擷取中...' : '使用此街景'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

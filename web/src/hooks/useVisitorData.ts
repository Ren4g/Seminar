/**
 * @file useVisitorData.ts
 * @description Hook quản lý nạp dữ liệu khách tham quan: Danh sách địa điểm, POI, bài thuyết minh, ngôn ngữ và lịch sử nghe LocalStorage.
 * @screen Giao diện Visitor (Trang chủ & Chi tiết điểm).
 * @activityDiagram Bước "Tải danh mục địa điểm, POI và nạp nội dung thuyết minh theo ngôn ngữ".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Chu kỳ tự động làm mới nội dung: Biến `REFRESH_INTERVAL_MS`.
 */

import { useEffect, useState, type MouseEvent } from 'react';
import { api, type ApiContent, type ApiLanguage, type ApiLocation, type ApiPoi } from '../api';

const REFRESH_INTERVAL_MS = 15_000;

// [TÍNH NĂNG: Hook đồng bộ dữ liệu điểm đến, bài thuyết minh và lịch sử nghe]
export function useVisitorData(poiId: number | null, language: string, onLanguageFallback?: (fallbackLang: string) => void) {
  const [content, setContent] = useState<ApiContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [locations, setLocations] = useState<ApiLocation[]>([]);
  const [pois, setPois] = useState<ApiPoi[]>([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [placesError, setPlacesError] = useState('');
  const [history, setHistory] = useState<{ title: string; poiId: number; listenedAt: string }[]>([]);
  const [poiLanguages, setPoiLanguages] = useState<{ code: string; name: string; isFallback: boolean; hasVoice: boolean }[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<ApiLanguage[]>([
    { code: 'vi', name: 'Tiếng Việt', isActive: true, isFallback: false },
    { code: 'en', name: 'English', isActive: true, isFallback: true },
  ]);

  // [TÍNH NĂNG: Nạp danh sách ngôn ngữ kích hoạt trong hệ thống]
  useEffect(() => {
    let mounted = true;
    void api.languages('').then((configured) => {
      if (!mounted) return;
      const byCode = new Map<string, ApiLanguage>([
        ['vi', { code: 'vi', name: 'Tiếng Việt', isActive: true, isFallback: false }],
        ['en', { code: 'en', name: 'English', isActive: true, isFallback: true }],
        ...configured.filter((item) => item.isActive).map((item) => [item.code, item] as [string, ApiLanguage]),
      ]);
      setAvailableLanguages([...byCode.values()]);
    }).catch(() => undefined);
    return () => { mounted = false; };
  }, []);

  // [TÍNH NĂNG: Lấy danh sách ngôn ngữ hỗ trợ giọng đọc riêng cho POI]
  useEffect(() => {
    if (!poiId) {
      setPoiLanguages([]);
      return;
    }
    api.visitorPoiLanguages(poiId)
      .then((langs) => {
        setPoiLanguages(langs);
        const current = langs.find((l) => l.code === language);
        if (current && !current.hasVoice) {
          const fallback = langs.find((l) => l.hasVoice)?.code ?? 'en';
          if (fallback !== language && onLanguageFallback) {
            onLanguageFallback(fallback);
          }
        }
      })
      .catch(() => undefined);
  }, [poiId]);

  // [TÍNH NĂNG: Tải nội dung bài thuyết minh khi thay đổi POI hoặc Ngôn ngữ]
  useEffect(() => {
    if (!poiId) {
      setContent(null);
      setError('');
      setLoading(false);
      return;
    }
    setLoading(true);
    api.visitorContent(poiId, language)
      .then((nextContent) => {
        setContent(nextContent);
        setError('');
      })
      .catch((reason: unknown) => {
        setContent(null);
        setError(reason instanceof Error ? reason.message : 'Content is unavailable');
      })
      .finally(() => setLoading(false));
  }, [poiId, language]);

  // [TÍNH NĂNG: Tự động làm mới nội dung mỗi 15s nếu có cập nhật mới từ Admin]
  useEffect(() => {
    if (!poiId) return;
    let mounted = true;
    const refreshContent = () => {
      void api.visitorContent(poiId, language)
        .then((next) => {
          if (mounted) {
            setContent(next);
            setError('');
          }
        })
        .catch((reason: unknown) => {
          if (mounted) {
            setContent(null);
            setError(reason instanceof Error ? reason.message : 'Content is unavailable');
          }
        });
    };
    const timer = window.setInterval(refreshContent, REFRESH_INTERVAL_MS);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [poiId, language]);

  // [TÍNH NĂNG: Nạp danh mục Địa điểm, POI và Lịch sử LocalStorage]
  useEffect(() => {
    let mounted = true;
    const refreshPlaces = () => {
      void Promise.all([api.visitorLocations(), api.visitorPois()])
        .then(([nextLocations, nextPois]) => {
          if (!mounted) return;
          setLocations(nextLocations.filter((l) => l.isActive));
          setPois(nextPois.filter((p) => p.isActive));
          setPlacesError('');
        })
        .catch((reason: unknown) => {
          if (mounted) setPlacesError(reason instanceof Error ? reason.message : 'Could not load places');
        })
        .finally(() => {
          if (mounted) setPlacesLoading(false);
        });
    };
    refreshPlaces();
    const timer = window.setInterval(refreshPlaces, REFRESH_INTERVAL_MS);
    try {
      setHistory(JSON.parse(localStorage.getItem('audio-guide-history') ?? '[]'));
    } catch {
      setHistory([]);
    }
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  // [TÍNH NĂNG: Quản lý lịch sử nghe (Ghi nhận, Xóa tất cả, Xóa từng mục)]
  const rememberListening = (title: string) => {
    if (!poiId) return;
    const next = [{ title, poiId, listenedAt: new Date().toISOString() }, ...history.filter((i) => i.poiId !== poiId)].slice(0, 10);
    setHistory(next);
    localStorage.setItem('audio-guide-history', JSON.stringify(next));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('audio-guide-history');
  };

  const removeHistoryItem = (removeId: number, event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const next = history.filter((item) => item.poiId !== removeId);
    setHistory(next);
    localStorage.setItem('audio-guide-history', JSON.stringify(next));
  };

  return {
    content,
    loading,
    error,
    locations,
    pois,
    placesLoading,
    placesError,
    history,
    poiLanguages,
    availableLanguages,
    rememberListening,
    clearHistory,
    removeHistoryItem,
  };
}

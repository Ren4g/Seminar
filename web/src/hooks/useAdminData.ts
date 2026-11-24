/**
 * @file useAdminData.ts
 * @description Hook nạp và đồng bộ dữ liệu quản trị: Quản lý danh sách bài viết, POI, Voice ElevenLabs, Ngôn ngữ và chu kỳ làm mới 15s.
 * @screen Toàn bộ giao diện Admin.
 * @activityDiagram Bước "Đồng bộ dữ liệu quản trị thời gian thực từ Backend".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Chu kỳ tự động làm mới: Biến `AUTO_REFRESH_INTERVAL_MS`.
 */

import { useEffect, useState } from 'react';
import { api, type ApiLanguage, type ApiPoi, type ApiVoice } from '../api';
import type { ContentItem } from '../types/content';
import { mapContent } from '../utils/formatters';

const AUTO_REFRESH_INTERVAL_MS = 15_000;

// [TÍNH NĂNG: Hook nạp dữ liệu Admin từ API Backend]
export function useAdminData(
  token: string,
  onTokenInvalid: () => void,
  onToast: (msg: string) => void
) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [voices, setVoices] = useState<ApiVoice[]>([]);
  const [pois, setPois] = useState<ApiPoi[]>([]);
  const [languages, setLanguages] = useState<ApiLanguage[]>([]);
  const [selectedId, setSelectedId] = useState(1);

  useEffect(() => {
    if (!token) return;
    let mounted = true;

    const refresh = async (initial = false) => {
      try {
        const [content, availableVoices, availablePois, availableLanguages] = await Promise.all([
          api.content(token),
          api.voices(token),
          api.pois(token),
          api.languages(token),
        ]);
        if (!mounted) return;
        const nextItems = content.map(mapContent);
        setItems(nextItems);
        setSelectedId((current) =>
          nextItems.some((item) => item.id === current) ? current : nextItems[0]?.id ?? current
        );
        setVoices(availableVoices);
        setPois(availablePois);
        setLanguages(availableLanguages);
      } catch (error) {
        if (!mounted) return;
        if (initial) {
          onTokenInvalid();
        } else {
          onToast(error instanceof Error ? error.message : 'Could not refresh content');
        }
      }
    };

    void refresh(true);
    const timer = window.setInterval(() => {
      void refresh();
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [token]);

  return {
    items,
    setItems,
    voices,
    setVoices,
    pois,
    setPois,
    languages,
    setLanguages,
    selectedId,
    setSelectedId,
  };
}

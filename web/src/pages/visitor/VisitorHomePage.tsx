/**
 * @file VisitorHomePage.tsx
 * @description Màn hình Trang chủ khách tham quan: Tích hợp Hero banner, Điểm nổi bật, Danh sách địa điểm và Lịch sử nghe.
 * @screen Trang chủ khách tham quan (URL: `/` hoặc `/?language=vi`).
 * @activityDiagram Bước "Khám phá địa điểm" -> "Duyệt danh sách POI".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Ẩn/Hiện phần lịch sử nghe: Thẻ `<VisitorHistory />`.
 *  - Bố cục trang chủ: Sắp xếp thứ tự các thẻ con trong `<main className="visitor-home">`.
 */

import type { MouseEvent } from 'react';
import type { ApiLocation, ApiPoi } from '../../api';
import type { VisitorCopy } from '../../constants/visitorCopy';
import { VisitorHero } from '../../components/visitor/VisitorHero';
import { VisitorFeatured } from '../../components/visitor/VisitorFeatured';
import { VisitorPlacesList } from '../../components/visitor/VisitorPlacesList';
import { VisitorHistory } from '../../components/visitor/VisitorHistory';

type VisitorHomePageProps = {
  copy: VisitorCopy;
  language: string;
  locations: ApiLocation[];
  pois: ApiPoi[];
  placesLoading: boolean;
  placesError: string;
  history: { title: string; poiId: number; listenedAt: string }[];
  onViewMap: () => void;
  onClearHistory: () => void;
  onRemoveHistoryItem: (id: number, e: MouseEvent) => void;
  translate: (translations: { languageCode: string; name: string }[]) => string;
  translateLocation: (translations: ApiLocation['translations']) => string;
};

// [TÍNH NĂNG: Toàn bộ bố cục màn hình Trang chủ Visitor]
export function VisitorHomePage({
  copy,
  language,
  locations,
  pois,
  placesLoading,
  placesError,
  history,
  onViewMap,
  onClearHistory,
  onRemoveHistoryItem,
  translate,
  translateLocation,
}: VisitorHomePageProps) {
  return (
    <main className="visitor-home">
      {/* [TÍNH NĂNG: Khung Hero Banner & Điểm nổi bật] */}
      <section className="visitor-hero">
        <VisitorHero copy={copy} onViewMap={onViewMap} />
        <VisitorFeatured
          pois={pois}
          locations={locations}
          language={language}
          copy={copy}
          placesLoading={placesLoading}
          placesError={placesError}
          translate={translate}
          translateLocation={translateLocation}
        />
      </section>

      {/* [TÍNH NĂNG: Danh sách các khu di tích và điểm tham quan] */}
      <VisitorPlacesList
        locations={locations}
        pois={pois}
        language={language}
        copy={copy}
        placesLoading={placesLoading}
        placesError={placesError}
        onViewMap={onViewMap}
        translate={translate}
        translateLocation={translateLocation}
      />

      {/* [TÍNH NĂNG: Lịch sử nghe gần đây của người dùng] */}
      <VisitorHistory
        history={history}
        language={language}
        copy={copy}
        onClearHistory={onClearHistory}
        onRemoveItem={onRemoveHistoryItem}
      />
    </main>
  );
}

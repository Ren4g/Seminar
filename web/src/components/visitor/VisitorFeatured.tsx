/**
 * @file VisitorFeatured.tsx
 * @description Danh sách 3 điểm tham quan nổi bật đánh số 01, 02, 03 đặt cạnh Hero banner.
 * @screen Nửa bên phải của phần Hero Banner trên Trang chủ.
 * @activityDiagram Bước "Khách chọn điểm tham quan nổi bật".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Số lượng điểm nổi bật hiển thị: Biến `FEATURED_COUNT` bên dưới.
 */

import type { ApiLocation, ApiPoi } from '../../api';
import type { VisitorCopy } from '../../constants/visitorCopy';

// ==================== CẤU HÌNH ĐIỂM NỔI BẬT ====================
const FEATURED_COUNT = 3;

type VisitorFeaturedProps = {
  pois: ApiPoi[];
  locations: ApiLocation[];
  language: string;
  copy: VisitorCopy;
  placesLoading: boolean;
  placesError: string;
  translate: (translations: { languageCode: string; name: string }[]) => string;
  translateLocation: (translations: ApiLocation['translations']) => string;
};

// [TÍNH NĂNG: Khung điểm tham quan nổi bật (Featured Points)]
export function VisitorFeatured({
  pois,
  locations,
  language,
  copy,
  placesLoading,
  placesError,
  translate,
  translateLocation,
}: VisitorFeaturedProps) {
  return (
    <div className="visitor-featured" aria-label={copy.featured}>
      {placesLoading ? (
        <p>{copy.loadingFeatured}</p>
      ) : pois.length ? (
        pois.slice(0, FEATURED_COUNT).map((poi, index) => {
          const parentLoc = locations.find((location) => location.id === poi.locationId);
          return (
            <a key={poi.id} href={`/visitor?poiId=${poi.id}&language=${language}`}>
              <span>0{index + 1}</span>
              <strong>{translate(poi.translations)}</strong>
              <small>{translateLocation(parentLoc?.translations ?? [])}</small>
              <span aria-hidden="true">&#x2197;</span>
            </a>
          );
        })
      ) : (
        <p>{placesError || copy.featuredEmpty}</p>
      )}
    </div>
  );
}

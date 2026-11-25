/**
 * @file VisitorPlacesList.tsx
 * @description Danh sách các khu di tích/địa điểm (Locations) và các điểm tham quan (POIs) trực thuộc trên trang chủ.
 * @screen Khu vực danh sách địa điểm trên Trang chủ khách tham quan (id="visitor-places").
 * @activityDiagram Bước "Khách duyệt danh sách điểm tham quan" -> "Chọn điểm cần nghe".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Nút xem bản đồ: `<button className="quiet-button">`.
 *  - Định dạng hiển thị thẻ địa điểm: Class `.visitor-place`, `.visitor-place-copy`.
 */

import type { ApiLocation, ApiPoi } from '../../api';
import type { VisitorCopy } from '../../constants/visitorCopy';

type VisitorPlacesListProps = {
  locations: ApiLocation[];
  pois: ApiPoi[];
  language: string;
  copy: VisitorCopy;
  placesLoading: boolean;
  placesError: string;
  onViewMap: () => void;
  translate: (translations: { languageCode: string; name: string }[]) => string;
  translateLocation: (translations: ApiLocation['translations']) => string;
};

// [TÍNH NĂNG: Danh sách địa điểm và các điểm tham quan trực thuộc]
export function VisitorPlacesList({
  locations,
  pois,
  language,
  copy,
  placesLoading,
  placesError,
  onViewMap,
  translate,
  translateLocation,
}: VisitorPlacesListProps) {
  return (
    <section className="visitor-home-section" id="visitor-places">
      <div className="visitor-home-heading">
        <div>
          <h2>{copy.placesHeading}</h2>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button type="button" className="quiet-button" onClick={onViewMap}>
            <span className="icon" aria-hidden="true">⌖</span>
            <span>{copy.viewMap}</span>
          </button>
          <span>
            {pois.length} {pois.length === 1 ? copy.poiSingular : copy.poiPlural}
          </span>
        </div>
      </div>

      {placesLoading ? (
        <p className="visitor-loading">{copy.loadingPlaces}</p>
      ) : placesError ? (
        <p className="visitor-empty">{placesError}</p>
      ) : locations.length === 0 ? (
        <p className="visitor-empty">{copy.noPlaces}</p>
      ) : (
        <div className="visitor-place-list">
          {locations.map((location) => {
            const placePois = pois.filter((poi) => poi.locationId === location.id);
            const placeDescription =
              location.translations.find((item) => item.languageCode === language)?.shortDescription ??
              location.translations.find((item) => item.languageCode === 'en')?.shortDescription ??
              copy.defaultLocationDescription;

            return (
              <article className="visitor-place" key={location.id}>
                <div className="visitor-place-copy">
                  <h3>{translateLocation(location.translations)}</h3>
                  <p>{placeDescription}</p>
                  <div className="visitor-place-pois">
                    {placePois.map((poi) => (
                      <a key={poi.id} href={`/visitor?poiId=${poi.id}&language=${language}`}>
                        {translate(poi.translations)} <span aria-hidden="true">&#x2197;</span>
                      </a>
                    ))}
                  </div>
                </div>
                <span className="visitor-place-count">
                  {placePois.length} {copy.placeCount}
                </span>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

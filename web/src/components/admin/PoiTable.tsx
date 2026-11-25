/**
 * @file PoiTable.tsx
 * @description Bảng hiển thị danh sách các Điểm tham quan (POIs): ID, Tên song ngữ, Thuộc Location nào, Trạng thái, các nút Bật-Tắt/Xóa.
 * @screen Phần 2 của bảng quản trị trong Tab "Địa điểm & POI".
 * @activityDiagram Bước "Xem và quản trị danh mục điểm tham quan đón khách".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Nút Bật/Tắt POI: Gọi `onToggleActive(poi.id, poi.isActive)`.
 *  - Nút Xóa POI: Gọi `onDeletePoi(poi.id)`.
 */

import type { ApiLocation, ApiPoi } from '../../api';

type PoiTableProps = {
  pois: ApiPoi[];
  locations: ApiLocation[];
  onToggleActive: (id: number, isActive: boolean) => void;
  onDeletePoi: (id: number) => void;
};

// [TÍNH NĂNG: Bảng danh sách Điểm tham quan (POI)]
export function PoiTable({
  pois,
  locations,
  onToggleActive,
  onDeletePoi,
}: PoiTableProps) {
  return (
    <>
      <div style={{ padding: '16px 4px 4px', gridColumn: '1 / -1', fontWeight: 600, color: 'var(--ink)' }}>
        2. Danh sách Điểm tham quan (POIs)
      </div>

      {pois.length === 0 ? (
        <p className="empty-state">Chưa có POI nào.</p>
      ) : (
        pois.map((item) => {
          const parentLoc = locations.find((l) => l.id === item.locationId);
          const parentName =
            parentLoc?.translations.find((t) => t.languageCode === 'vi')?.name ||
            parentLoc?.translations[0]?.name ||
            `Location #${item.locationId}`;

          return (
            <div className="crud-row" key={`poi-${item.id}`}>
              <strong>POI #{item.id}</strong>
              <span>{item.translations.map((t) => t.name).join(' · ')}</span>
              <span>
                Thuộc: <strong>{parentName}</strong>
              </span>
              <span className={`status status--${item.isActive ? 'published' : 'draft'}`}>
                {item.isActive ? 'Hoạt động' : 'Tạm tắt'}
              </span>
              <button
                className="quiet-button"
                type="button"
                onClick={() => onToggleActive(item.id, item.isActive)}
              >
                {item.isActive ? 'Tắt' : 'Bật'}
              </button>
              <button className="quiet-button" type="button" onClick={() => onDeletePoi(item.id)}>
                Xóa
              </button>
            </div>
          );
        })
      )}
    </>
  );
}

/**
 * @file LocationTable.tsx
 * @description Bảng hiển thị danh sách các Địa điểm (Locations): ID, Tên song ngữ, Địa chỉ, Tọa độ bản đồ, Số POI con, Trạng thái, các nút Sửa/Bật-Tắt/Xóa.
 * @screen Phần 1 của bảng quản trị trong Tab "Địa điểm & POI".
 * @activityDiagram Bước "Xem và quản trị danh mục khu di tích".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Nút Sửa: Gọi `onEditLocation(item)`.
 *  - Nút Bật/Tắt: Gọi `onToggleActive(item.id, item.isActive)`.
 *  - Nút Xóa: Gọi `onDeleteLocation(item.id)`.
 */

import type { ApiLocation, ApiPoi } from '../../api';

type LocationTableProps = {
  locations: ApiLocation[];
  pois: ApiPoi[];
  onEditLocation: (location: ApiLocation) => void;
  onToggleActive: (id: number, isActive: boolean) => void;
  onDeleteLocation: (id: number) => void;
};

// [TÍNH NĂNG: Bảng danh sách Địa điểm khu di tích]
export function LocationTable({
  locations,
  pois,
  onEditLocation,
  onToggleActive,
  onDeleteLocation,
}: LocationTableProps) {
  return (
    <>
      <div style={{ padding: '8px 4px 4px', gridColumn: '1 / -1', fontWeight: 600, color: 'var(--ink)' }}>
        1. Danh sách Địa điểm (Locations)
      </div>

      {locations.length === 0 ? (
        <p className="empty-state">Chưa có địa điểm nào.</p>
      ) : (
        locations.map((item) => {
          const hasCoords =
            item.latitude != null &&
            item.longitude != null &&
            !Number.isNaN(Number(item.latitude)) &&
            !Number.isNaN(Number(item.longitude));
          const directPoisCount = pois.filter((poi) => poi.locationId === item.id).length;

          return (
            <div className="crud-row" key={`location-${item.id}`}>
              <strong>Location #{item.id}</strong>
              <span>{item.translations.map((t) => t.name).join(' · ')}</span>
              <span>
                {item.address ? (
                  <span title={item.address} style={{ fontSize: '12px', color: 'var(--ink)' }}>
                    📍 {item.address.length > 25 ? item.address.slice(0, 25) + '…' : item.address}
                  </span>
                ) : (
                  <small style={{ color: 'var(--muted)' }}>Chưa có địa chỉ</small>
                )}
              </span>
              <span>
                {hasCoords ? (
                  <span
                    className="location-badge-has-coords"
                    title={`Lat: ${item.latitude}, Lng: ${item.longitude}`}
                  >
                    ✓ {Number(item.latitude).toFixed(4)}, {Number(item.longitude).toFixed(4)}
                  </span>
                ) : (
                  <span className="location-badge-no-coords">Chưa có tọa độ</span>
                )}
              </span>
              <span>{directPoisCount} POI trực thuộc</span>
              <span className={`status status--${item.isActive ? 'published' : 'draft'}`}>
                {item.isActive ? 'Hoạt động' : 'Tạm tắt'}
              </span>
              <button className="quiet-button" type="button" onClick={() => onEditLocation(item)}>
                Sửa
              </button>
              <button
                className="quiet-button"
                type="button"
                onClick={() => onToggleActive(item.id, item.isActive)}
              >
                {item.isActive ? 'Tắt' : 'Bật'}
              </button>
              <button className="quiet-button" type="button" onClick={() => onDeleteLocation(item.id)}>
                Xóa
              </button>
            </div>
          );
        })
      )}
    </>
  );
}

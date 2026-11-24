/**
 * @file LocationCreateForm.tsx
 * @description Form nhập liệu tạo mới Địa điểm (Location): Tên Việt/Anh, địa chỉ, tra cứu Geocoding tự động và bản đồ chấm tay Leaflet.
 * @screen Tab "Địa điểm & POI" trong trang quản trị khi chọn "Tạo Địa điểm (Location)".
 * @activityDiagram Bước "Thiết lập địa điểm di tích mới và chấm tọa độ bản đồ".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Nút Geocode: Thẻ `<button className="geocode-btn">`.
 *  - Bản đồ chấm tọa độ: Thẻ `<LocationMapPicker />`.
 */

import { LocationMapPicker } from '../../LocationMapPicker';

type LocationCreateFormProps = {
  form: {
    nameVi: string;
    nameEn: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
  };
  geocodingBusy: boolean;
  geocodingStatus: { type: 'success' | 'error' | 'idle'; text: string };
  onChange: (fields: Partial<LocationCreateFormProps['form']>) => void;
  onTriggerGeocode: () => void;
};

// [TÍNH NĂNG: Form tạo mới Địa điểm với Geocoding và bản đồ vị trí]
export function LocationCreateForm({
  form,
  geocodingBusy,
  geocodingStatus,
  onChange,
  onTriggerGeocode,
}: LocationCreateFormProps) {
  return (
    <>
      <label>
        Tên địa điểm (tiếng Việt)
        <input
          value={form.nameVi}
          onChange={(e) => onChange({ nameVi: e.target.value })}
          placeholder="Ví dụ: Hoàng Thành Thăng Long"
          required
        />
      </label>
      <label>
        Tên tiếng Anh (English)
        <input
          value={form.nameEn}
          onChange={(e) => onChange({ nameEn: e.target.value })}
          placeholder="Ví dụ: Imperial Citadel of Thang Long"
        />
      </label>
      <label style={{ gridColumn: '1 / -1' }}>
        Địa chỉ
        <input
          value={form.address}
          onChange={(e) => onChange({ address: e.target.value })}
          placeholder="Ví dụ: 19C Hoàng Diệu, Quán Thánh, Ba Đình, Hà Nội"
        />
      </label>
      <div style={{ gridColumn: '1 / -1' }}>
        <div className="geocode-actions-row">
          <button
            type="button"
            className="geocode-btn"
            disabled={geocodingBusy || !form.address.trim()}
            onClick={onTriggerGeocode}
          >
            {geocodingBusy ? 'Đang tìm...' : '🔍 Tìm vị trí (Geocode)'}
          </button>
          {geocodingStatus.text && (
            <span className={`geocode-status is-${geocodingStatus.type}`}>{geocodingStatus.text}</span>
          )}
        </div>
        <div className="coords-display-row">
          <label>
            Vĩ độ (Latitude)
            <input
              type="number"
              step="any"
              value={form.latitude ?? ''}
              onChange={(e) => onChange({ latitude: e.target.value ? Number(e.target.value) : null })}
              placeholder="Chấm tay hoặc tự động điền"
            />
          </label>
          <label>
            Kinh độ (Longitude)
            <input
              type="number"
              step="any"
              value={form.longitude ?? ''}
              onChange={(e) => onChange({ longitude: e.target.value ? Number(e.target.value) : null })}
              placeholder="Chấm tay hoặc tự động điền"
            />
          </label>
        </div>
        <div style={{ marginTop: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>
            Bản đồ vị trí (Kéo ghim hoặc nhấp chuột để chấm tay tọa độ):
          </span>
          <LocationMapPicker
            latitude={form.latitude}
            longitude={form.longitude}
            onChange={(lat, lng) => onChange({ latitude: lat, longitude: lng })}
            height={220}
          />
        </div>
      </div>
    </>
  );
}

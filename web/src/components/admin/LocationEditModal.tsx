/**
 * @file LocationEditModal.tsx
 * @description Hộp thoại Modal chỉnh sửa thông tin Địa điểm: Tên tiếng Việt/Anh, địa chỉ, tra cứu Geocoding tự động và kéo ghim chấm tọa độ trên bản đồ.
 * @screen Tab "Địa điểm & POI" khi người dùng bấm nút "Sửa" trên 1 dòng Địa điểm.
 * @activityDiagram Bước "Cập nhật tọa độ định vị và thông tin khu di tích".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Tra cứu Geocoding: Hàm `triggerGeocode()`.
 *  - Lưu cập nhật: Hàm `saveEditLocation()`.
 *  - Bản đồ chấm tọa độ: Thẻ `<LocationMapPicker />`.
 */

import { useState, type FormEvent } from 'react';
import { api, type ApiLocation } from '../../api';
import { LocationMapPicker } from '../../LocationMapPicker';

type LocationEditModalProps = {
  token: string;
  editingLocation: ApiLocation;
  onClose: () => void;
  onSuccess: () => void;
  onToast: (msg: string) => void;
};

// [TÍNH NĂNG: Modal chỉnh sửa Địa điểm và tọa độ bản đồ]
export function LocationEditModal({
  token,
  editingLocation,
  onClose,
  onSuccess,
  onToast,
}: LocationEditModalProps) {
  const viName = editingLocation.translations.find((t) => t.languageCode === 'vi')?.name || '';
  const enName = editingLocation.translations.find((t) => t.languageCode === 'en')?.name || '';

  const [editForm, setEditForm] = useState({
    nameVi: viName,
    nameEn: enName,
    address: editingLocation.address || '',
    latitude: editingLocation.latitude != null ? Number(editingLocation.latitude) : null,
    longitude: editingLocation.longitude != null ? Number(editingLocation.longitude) : null,
  });

  const [editGeocodingBusy, setEditGeocodingBusy] = useState(false);
  const [editGeocodingStatus, setEditGeocodingStatus] = useState<{
    type: 'success' | 'error' | 'idle';
    text: string;
  }>({ type: 'idle', text: '' });
  const [busy, setBusy] = useState(false);

  // [TÍNH NĂNG: Tra cứu tọa độ tự động từ địa chỉ (Geocoding)]
  const triggerGeocode = async (addressToSearch: string) => {
    if (!addressToSearch.trim()) {
      onToast('Vui lòng nhập địa chỉ trước khi tìm vị trí');
      return;
    }
    setEditGeocodingBusy(true);
    setEditGeocodingStatus({ type: 'idle', text: 'Đang tra cứu tọa độ từ địa chỉ...' });

    try {
      const res = await api.geocodeAddress(token, addressToSearch.trim());
      if (res.found && res.latitude != null && res.longitude != null) {
        setEditForm((prev) => ({
          ...prev,
          latitude: res.latitude!,
          longitude: res.longitude!,
        }));
        setEditGeocodingStatus({
          type: 'success',
          text: `Đã tìm thấy: (${res.latitude}, ${res.longitude})`,
        });
        onToast('Đã xác định tọa độ từ địa chỉ.');
      } else {
        const msg = res.message || 'Không tìm thấy tọa độ. Bạn có thể chấm tay trên bản đồ bên dưới.';
        setEditGeocodingStatus({ type: 'error', text: msg });
        onToast('Không tìm thấy tọa độ cho địa chỉ này.');
      }
    } catch {
      const msg = 'Lỗi kết nối Geocoding. Bạn có thể chấm tay vị trí trên bản đồ.';
      setEditGeocodingStatus({ type: 'error', text: msg });
      onToast('Không thể kết nối dịch vụ geocoding.');
    } finally {
      setEditGeocodingBusy(false);
    }
  };

  // [TÍNH NĂNG: Lưu thông tin địa điểm và tọa độ đã sửa]
  const saveEditLocation = async (e: FormEvent) => {
    e.preventDefault();
    const en = editForm.nameEn.trim() || editForm.nameVi.trim();
    const vi = editForm.nameVi.trim() || editForm.nameEn.trim();
    if (!en) {
      onToast('Vui lòng nhập tên địa điểm');
      return;
    }
    setBusy(true);
    try {
      const translations = [
        { languageCode: 'en', name: en },
        ...(vi !== en ? [{ languageCode: 'vi', name: vi }] : [{ languageCode: 'vi', name: vi }]),
      ];
      await api.updateLocation(token, editingLocation.id, {
        translations,
        address: editForm.address.trim() || undefined,
        latitude: editForm.latitude,
        longitude: editForm.longitude,
      });
      onSuccess();
      onToast('Đã cập nhật thông tin địa điểm và tọa độ.');
      onClose();
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Không thể cập nhật địa điểm');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-loc-title">
      <form className="modal-card location-edit-modal-card" onSubmit={saveEditLocation}>
        <button type="button" className="close-button" aria-label="Đóng" onClick={onClose}>
          ×
        </button>
        <h2 id="edit-loc-title">Cập nhật Địa điểm #{editingLocation.id}</h2>

        <label>
          Tên địa điểm (tiếng Việt)
          <input
            value={editForm.nameVi}
            onChange={(e) => setEditForm({ ...editForm, nameVi: e.target.value })}
            required
          />
        </label>

        <label>
          Tên tiếng Anh (English)
          <input
            value={editForm.nameEn}
            onChange={(e) => setEditForm({ ...editForm, nameEn: e.target.value })}
          />
        </label>

        <label>
          Địa chỉ
          <input
            value={editForm.address}
            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
            placeholder="Ví dụ: 19C Hoàng Diệu, Quán Thánh, Ba Đình, Hà Nội"
          />
        </label>

        {/* [TÍNH NĂNG: Nút bấm tra cứu Geocoding từ địa chỉ] */}
        <div className="geocode-actions-row">
          <button
            type="button"
            className="geocode-btn"
            disabled={editGeocodingBusy || !editForm.address.trim()}
            onClick={() => triggerGeocode(editForm.address)}
          >
            {editGeocodingBusy ? 'Đang tìm...' : '🔍 Tìm vị trí (Geocode)'}
          </button>
          {editGeocodingStatus.text && (
            <span className={`geocode-status is-${editGeocodingStatus.type}`}>
              {editGeocodingStatus.text}
            </span>
          )}
        </div>

        <div className="coords-display-row">
          <label>
            Vĩ độ (Latitude)
            <input
              type="number"
              step="any"
              value={editForm.latitude ?? ''}
              onChange={(e) =>
                setEditForm({ ...editForm, latitude: e.target.value ? Number(e.target.value) : null })
              }
              placeholder="Chưa có vĩ độ"
            />
          </label>
          <label>
            Kinh độ (Longitude)
            <input
              type="number"
              step="any"
              value={editForm.longitude ?? ''}
              onChange={(e) =>
                setEditForm({ ...editForm, longitude: e.target.value ? Number(e.target.value) : null })
              }
              placeholder="Chưa có kinh độ"
            />
          </label>
        </div>

        {/* [TÍNH NĂNG: Bản đồ Leaflet chấm tọa độ bằng tay] */}
        <div style={{ marginTop: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>
            Bản đồ vị trí (Kéo ghim hoặc click để chấm tay lại):
          </span>
          <LocationMapPicker
            latitude={editForm.latitude}
            longitude={editForm.longitude}
            onChange={(lat, lng) => setEditForm((prev) => ({ ...prev, latitude: lat, longitude: lng }))}
            height={240}
          />
        </div>

        <div className="modal-actions" style={{ marginTop: '16px' }}>
          <button type="button" className="quiet-button" onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className="primary-button" disabled={busy}>
            {busy ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
}

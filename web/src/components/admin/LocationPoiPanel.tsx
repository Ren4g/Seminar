/**
 * @file LocationPoiPanel.tsx
 * @description Màn hình "Địa điểm & POI": Tích hợp Form tạo Location, Form tạo POI, Bảng danh sách Location và Bảng POI.
 * @screen Tab "Địa điểm & POI" trong trang quản trị Admin.
 * @activityDiagram Bước "Thiết lập danh mục di tích" -> "Tạo điểm tham quan (POI) đón khách".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Nút chuyển tab: `<div className="segmented">`.
 *  - Form tạo Location: Thẻ `<LocationCreateForm />`.
 *  - Form tạo POI: Thẻ `<PoiCreateForm />`.
 */

import { useEffect, useState, type FormEvent } from 'react';
import { api, type ApiLocation, type ApiPoi } from '../../api';
import { LocationCreateForm } from './LocationCreateForm';
import { PoiCreateForm } from './PoiCreateForm';
import { LocationTable } from './LocationTable';
import { PoiTable } from './PoiTable';
import { LocationEditModal } from './LocationEditModal';

type LocationPoiPanelProps = {
  token: string;
  onToast: (msg: string) => void;
  onPoisChange?: (pois: ApiPoi[]) => void;
};

// [TÍNH NĂNG: Khung điều phối Quản lý Địa điểm và POI]
export function LocationPoiPanel({ token, onToast, onPoisChange }: LocationPoiPanelProps) {
  const [locations, setLocations] = useState<ApiLocation[]>([]);
  const [pois, setPois] = useState<ApiPoi[]>([]);
  const [entityKind, setEntityKind] = useState<'location' | 'poi'>('poi');
  const [busy, setBusy] = useState(false);
  const [panelMessage, setPanelMessage] = useState('');
  const [editingLocation, setEditingLocation] = useState<ApiLocation | null>(null);

  const [form, setForm] = useState({
    nameVi: '',
    nameEn: '',
    locationId: '',
    address: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const [geocodingBusy, setGeocodingBusy] = useState(false);
  const [geocodingStatus, setGeocodingStatus] = useState<{ type: 'success' | 'error' | 'idle'; text: string }>({
    type: 'idle',
    text: '',
  });

  const reload = async () => {
    const [nextLocations, nextPois] = await Promise.all([api.locations(token), api.pois(token)]);
    setLocations(nextLocations);
    setPois(nextPois);
    onPoisChange?.(nextPois);
  };

  useEffect(() => {
    void reload().catch((err: unknown) => onToast(err instanceof Error ? err.message : 'Không thể tải dữ liệu'));
  }, []);

  // [TÍNH NĂNG: Tra cứu Geocoding khi tạo địa điểm mới]
  const triggerGeocode = async () => {
    if (!form.address.trim()) {
      onToast('Vui lòng nhập địa chỉ trước khi tìm vị trí');
      return;
    }
    setGeocodingBusy(true);
    setGeocodingStatus({ type: 'idle', text: 'Đang tra cứu tọa độ từ địa chỉ...' });
    try {
      const res = await api.geocodeAddress(token, form.address.trim());
      if (res.found && res.latitude != null && res.longitude != null) {
        setForm((prev) => ({ ...prev, latitude: res.latitude!, longitude: res.longitude! }));
        setGeocodingStatus({ type: 'success', text: `Đã tìm thấy: (${res.latitude}, ${res.longitude})` });
        onToast('Đã xác định tọa độ từ địa chỉ.');
      } else {
        setGeocodingStatus({ type: 'error', text: res.message || 'Không tìm thấy tọa độ. Bạn có thể chấm tay.' });
        onToast('Không tìm thấy tọa độ.');
      }
    } catch {
      setGeocodingStatus({ type: 'error', text: 'Lỗi kết nối Geocoding. Bạn có thể chấm tay trên bản đồ.' });
      onToast('Không thể kết nối dịch vụ geocoding.');
    } finally {
      setGeocodingBusy(false);
    }
  };

  // [TÍNH NĂNG: Bật/Tắt trạng thái hoạt động của Location hoặc POI]
  const toggleCatalog = async (kind: 'location' | 'poi', id: number, isActive: boolean) => {
    try {
      if (kind === 'location') await api.setLocationActive(token, id, !isActive);
      else await api.setPoiActive(token, id, !isActive);
      await reload();
      onToast(isActive ? 'Đã tắt bản ghi.' : 'Đã bật bản ghi.');
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái');
    }
  };

  // [TÍNH NĂNG: Xóa Địa điểm]
  const deleteLocation = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa điểm này?')) return;
    try {
      await api.deleteLocation(token, id);
      await reload();
      setPanelMessage('Đã xóa địa điểm thành công.');
      onToast('Đã xóa địa điểm.');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Không thể xóa địa điểm';
      setPanelMessage(msg);
      onToast(msg);
      window.alert(msg);
    }
  };

  // [TÍNH NĂNG: Xóa Điểm tham quan POI]
  const deletePoi = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa điểm tham quan (POI) này?')) return;
    try {
      await api.deletePoi(token, id);
      await reload();
      setPanelMessage('Đã xóa POI thành công.');
      onToast('Đã xóa POI.');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Không thể xóa POI';
      setPanelMessage(msg);
      onToast(msg);
      window.alert(msg);
    }
  };

  // [TÍNH NĂNG: Tạo mới Địa điểm hoặc POI]
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (entityKind === 'location') {
        const vi = form.nameVi.trim();
        const en = form.nameEn.trim() || vi;
        if (!en) {
          onToast('Vui lòng nhập tên địa điểm');
          setBusy(false);
          return;
        }
        const translations = [
          { languageCode: 'en', name: en },
          ...(vi && vi !== en ? [{ languageCode: 'vi', name: vi }] : [{ languageCode: 'vi', name: vi || en }]),
        ];
        await api.createLocation(
          token,
          translations,
          form.address.trim() || undefined,
          form.latitude != null ? form.latitude : undefined,
          form.longitude != null ? form.longitude : undefined
        );
      } else {
        if (!form.locationId) {
          onToast('Vui lòng chọn Địa điểm cha cho POI');
          setBusy(false);
          return;
        }
        const vi = form.nameVi.trim();
        const en = form.nameEn.trim() || vi;
        if (!en) {
          onToast('Vui lòng nhập tên điểm tham quan (POI)');
          setBusy(false);
          return;
        }
        const translations = [
          { languageCode: 'en', name: en },
          ...(vi && vi !== en ? [{ languageCode: 'vi', name: vi }] : [{ languageCode: 'vi', name: vi || en }]),
        ];
        await api.createPoi(token, Number(form.locationId), translations);
      }
      await reload();
      setForm({ nameVi: '', nameEn: '', locationId: '', address: '', latitude: null, longitude: null });
      setGeocodingStatus({ type: 'idle', text: '' });
      onToast('Đã lưu thay đổi.');
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Không thể lưu');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="catalog-panel">
      <div className="catalog-heading">
        <div>
          <h2>Địa điểm và điểm tham quan.</h2>
        </div>
        <span className="catalog-count">{locations.length} địa điểm · {pois.length} POI</span>
      </div>

      {/* [TÍNH NĂNG: Nút chuyển tab chọn tạo Địa điểm hay tạo POI] */}
      <div className="segmented" style={{ width: 'fit-content', marginBottom: '18px' }} role="tablist">
        <button
          type="button"
          className={entityKind === 'location' ? 'is-selected' : ''}
          onClick={() => setEntityKind('location')}
        >
          Tạo Địa điểm (Location)
        </button>
        <button
          type="button"
          className={entityKind === 'poi' ? 'is-selected' : ''}
          onClick={() => setEntityKind('poi')}
        >
          Tạo Điểm tham quan (POI)
        </button>
      </div>

      <form className="crud-form" onSubmit={submit}>
        {entityKind === 'location' ? (
          <LocationCreateForm
            form={form}
            geocodingBusy={geocodingBusy}
            geocodingStatus={geocodingStatus}
            onChange={(fields) => setForm((prev) => ({ ...prev, ...fields }))}
            onTriggerGeocode={triggerGeocode}
          />
        ) : (
          <PoiCreateForm
            locations={locations}
            form={form}
            onChange={(fields) => setForm((prev) => ({ ...prev, ...fields }))}
          />
        )}
        <button
          type="submit"
          className="primary-button"
          disabled={busy || (entityKind === 'poi' && locations.length === 0)}
        >
          {busy ? 'Đang lưu…' : entityKind === 'location' ? 'Tạo địa điểm' : 'Tạo POI'}
        </button>
      </form>

      {panelMessage && <p className="toast" role="status" style={{ margin: '14px 0' }}>{panelMessage}</p>}

      <div className="crud-table">
        <LocationTable
          locations={locations}
          pois={pois}
          onEditLocation={setEditingLocation}
          onToggleActive={(id, active) => toggleCatalog('location', id, active)}
          onDeleteLocation={deleteLocation}
        />

        <PoiTable
          pois={pois}
          locations={locations}
          onToggleActive={(id, active) => toggleCatalog('poi', id, active)}
          onDeletePoi={deletePoi}
        />
      </div>

      {editingLocation && (
        <LocationEditModal
          token={token}
          editingLocation={editingLocation}
          onClose={() => setEditingLocation(null)}
          onSuccess={reload}
          onToast={onToast}
        />
      )}
    </section>
  );
}

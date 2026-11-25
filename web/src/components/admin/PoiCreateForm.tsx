/**
 * @file PoiCreateForm.tsx
 * @description Form nhập liệu tạo mới Điểm tham quan (POI): Chọn Địa điểm cha, nhập Tên tiếng Việt và Tên tiếng Anh.
 * @screen Tab "Địa điểm & POI" trong trang quản trị khi chọn "Tạo Điểm tham quan (POI)".
 * @activityDiagram Bước "Tạo điểm tham quan trực thuộc khu di tích".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Chọn Location cha: Dropdown `<select>`.
 */

import type { ApiLocation } from '../../api';

type PoiCreateFormProps = {
  locations: ApiLocation[];
  form: {
    locationId: string;
    nameVi: string;
    nameEn: string;
  };
  onChange: (fields: Partial<PoiCreateFormProps['form']>) => void;
};

// [TÍNH NĂNG: Form tạo mới Điểm tham quan POI trực thuộc]
export function PoiCreateForm({ locations, form, onChange }: PoiCreateFormProps) {
  return (
    <>
      <label>
        Thuộc địa điểm (Location cha)
        <select
          value={form.locationId}
          onChange={(e) => onChange({ locationId: e.target.value })}
          required
        >
          <option value="">-- Chọn Địa điểm cha --</option>
          {locations.map((loc) => {
            const vi = loc.translations.find((t) => t.languageCode === 'vi')?.name;
            const en = loc.translations.find((t) => t.languageCode === 'en')?.name;
            return (
              <option key={loc.id} value={loc.id}>
                {vi || en || `Location #${loc.id}`} (#{loc.id})
              </option>
            );
          })}
        </select>
      </label>
      <label>
        Tên điểm tham quan (tiếng Việt)
        <input
          value={form.nameVi}
          onChange={(e) => onChange({ nameVi: e.target.value })}
          placeholder="Ví dụ: Kỳ Đài"
          required
        />
      </label>
      <label>
        Tên tiếng Anh (English)
        <input
          value={form.nameEn}
          onChange={(e) => onChange({ nameEn: e.target.value })}
          placeholder="Ví dụ: Flag Tower"
        />
      </label>
    </>
  );
}

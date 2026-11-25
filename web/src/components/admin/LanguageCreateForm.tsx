/**
 * @file LanguageCreateForm.tsx
 * @description Form thêm cấu hình ngôn ngữ mới và giọng đọc ElevenLabs mặc định.
 * @screen Nằm trên cùng của Tab "Ngôn ngữ & giọng đọc" trong trang quản trị.
 * @activityDiagram Bước "Cấu hình ngôn ngữ mới cho hệ thống".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Danh sách ngôn ngữ mẫu: Mảng `PRESET_LANGUAGES` trong `constants/languages.ts`.
 */

import { PRESET_LANGUAGES } from '../../constants/languages';

type LanguageCreateFormProps = {
  form: { code: string; name: string; voice: string };
  busy: boolean;
  onChange: (fields: Partial<LanguageCreateFormProps['form']>) => void;
  onSubmit: (e: React.FormEvent) => void;
};

// [TÍNH NĂNG: Form thêm cấu hình ngôn ngữ và mã giọng đọc ElevenLabs]
export function LanguageCreateForm({ form, busy, onChange, onSubmit }: LanguageCreateFormProps) {
  return (
    <form className="crud-form" onSubmit={onSubmit}>
      <label>
        Chọn ngôn ngữ
        <select
          value={form.code}
          onChange={(event) => {
            const val = event.target.value;
            const match = PRESET_LANGUAGES.find((p) => p.code === val) ?? PRESET_LANGUAGES[0];
            onChange({ code: match.code, name: match.name, voice: match.defaultVoice });
          }}
        >
          {PRESET_LANGUAGES.map((preset) => (
            <option key={preset.code} value={preset.code}>
              {preset.name} ({preset.code.toUpperCase()})
            </option>
          ))}
        </select>
      </label>
      <label>
        ElevenLabs voice ID (mặc định gợi ý)
        <input
          value={form.voice}
          onChange={(event) => onChange({ voice: event.target.value })}
          placeholder="vd: 21m00Tcm4TlvDq8ikWAM"
        />
      </label>
      <button className="primary-button" disabled={busy}>
        {busy ? 'Đang lưu…' : 'Tạo bản ghi'}
      </button>
    </form>
  );
}

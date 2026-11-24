/**
 * @file CreateContentModal.tsx
 * @description Hộp thoại Modal tạo bài thuyết minh mới: Chọn Điểm tham quan (POI), chọn Ngôn ngữ, nhập Tiêu đề và Nội dung ban đầu.
 * @screen Nút "+ Tạo nội dung" trên thanh Admin Topbar.
 * @activityDiagram Bước "Khởi tạo bản nháp bài thuyết minh mới (Draft)".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Form tạo nội dung: Thẻ `<form className="modal-card">`.
 *  - Xử lý submit: Hàm `handleSubmit()`.
 */

import { useState, type FormEvent } from 'react';
import type { ApiLanguage, ApiPoi } from '../../api';

type CreateContentModalProps = {
  pois: ApiPoi[];
  languages: ApiLanguage[];
  onClose: () => void;
  onSubmit: (data: { poiId: string; languageCode: string; title: string; narrationText: string }) => void;
};

// [TÍNH NĂNG: Modal tạo mới bài thuyết minh dạng bản nháp]
export function CreateContentModal({
  pois,
  languages,
  onClose,
  onSubmit,
}: CreateContentModalProps) {
  const [form, setForm] = useState({
    poiId: '',
    languageCode: 'vi',
    title: '',
    narrationText: '',
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="create-title">
      <form className="modal-card" onSubmit={handleSubmit}>
        <button type="button" className="close-button" aria-label="Đóng form tạo nội dung" onClick={onClose}>
          ×
        </button>
        <h2 id="create-title">Tạo nội dung mới.</h2>

        <label>
          Điểm tham quan
          <select
            value={form.poiId}
            onChange={(event) => setForm({ ...form, poiId: event.target.value })}
            required
          >
            <option value="">Chọn POI</option>
            {pois.map((poi) => {
              const name =
                poi.translations.find((item) => item.languageCode === 'vi')?.name ??
                poi.translations.find((item) => item.languageCode === 'en')?.name ??
                'Unnamed';
              return (
                <option key={poi.id} value={poi.id}>
                  POI #{poi.id} · {name}
                </option>
              );
            })}
          </select>
        </label>

        <label>
          Ngôn ngữ
          <select
            value={form.languageCode}
            onChange={(event) => setForm({ ...form, languageCode: event.target.value })}
          >
            {languages
              .filter((l) => l.isActive)
              .map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.code.toUpperCase()})
                  {lang.isFallback ? ' · Mặc định' : ''}
                </option>
              ))}
          </select>
        </label>

        <label>
          Tiêu đề
          <input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="Cổng thành phía Đông"
            required
          />
        </label>

        <label>
          Nội dung thuyết minh
          <textarea
            value={form.narrationText}
            onChange={(event) => setForm({ ...form, narrationText: event.target.value })}
            rows={5}
            placeholder="Nhập lời thuyết minh..."
            required
          />
        </label>

        <div className="modal-actions">
          <button type="button" className="quiet-button" onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className="primary-button">
            Tạo bản nháp
          </button>
        </div>
      </form>
    </div>
  );
}

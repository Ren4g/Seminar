/**
 * @file VisitorHeader.tsx
 * @description Thanh tiêu đề đầu trang của khách tham quan: Logo, chọn chế độ xem (Khám phá / Bản đồ), nút vào Admin và dropdown chọn ngôn ngữ.
 * @screen Toàn bộ giao diện khách tham quan (Visitor Header).
 * @activityDiagram Bước "Khách chọn ngôn ngữ" & "Khách chuyển chế độ xem danh sách / bản đồ".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Đổi tên thương hiệu (Logo): Thẻ `a.visitor-brand` (hiện là "audio guide").
 *  - Thêm menu điều hướng: Thêm thẻ `<button>` vào `<nav className="visitor-nav-links">`.
 *  - Xử lý chọn ngôn ngữ: Sự kiện `onChange` tại dropdown `<select>`.
 */

import type { ApiLanguage } from '../../api';
import type { VisitorCopy } from '../../constants/visitorCopy';

type VisitorHeaderProps = {
  viewMode: 'list' | 'map';
  poiId: number | null;
  language: string;
  copy: VisitorCopy;
  availableLanguages: ApiLanguage[];
  poiLanguages: { code: string; name: string; isFallback: boolean; hasVoice: boolean }[];
  onSelectLanguage: (langCode: string) => void;
  onNavigateHome: () => void;
  onNavigateMap: () => void;
};

// [TÍNH NĂNG: Thanh điều hướng đầu trang Visitor]
export function VisitorHeader({
  viewMode,
  poiId,
  language,
  copy,
  availableLanguages,
  poiLanguages,
  onSelectLanguage,
  onNavigateHome,
  onNavigateMap,
}: VisitorHeaderProps) {
  return (
    <header className="visitor-nav">
      {/* [TÍNH NĂNG: Logo hệ thống - Bấm về trang chủ] */}
      <a
        className="visitor-brand"
        href="/"
        onClick={(e) => {
          e.preventDefault();
          onNavigateHome();
        }}
      >
        audio guide
      </a>

      {/* [TÍNH NĂNG: Menu chuyển đổi chế độ xem Khám phá / Bản đồ số] */}
      <nav className="visitor-nav-links" aria-label={copy.discover}>
        <button
          type="button"
          className={viewMode === 'list' && !poiId ? 'is-active' : ''}
          onClick={onNavigateHome}
        >
          {copy.discover}
        </button>
        <button
          type="button"
          className={viewMode === 'map' && !poiId ? 'is-active' : ''}
          onClick={onNavigateMap}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 17s5-5.4 5-9a5 5 0 0 0-10 0c0 3.6 5 9 5 9Z" fill="none" stroke="currentColor" strokeWidth="1.4"/><circle cx="10" cy="8" r="1.7" fill="none" stroke="currentColor" strokeWidth="1.4"/></svg>
          {copy.map}
        </button>
      </nav>

      {/* [TÍNH NĂNG: Hộp chọn ngôn ngữ thuyết minh] */}
      <label className="visitor-language">
        {copy.language}
        <select
          value={language}
          onChange={(event) => onSelectLanguage(event.target.value)}
        >
          {poiId && poiLanguages.length > 0
            ? poiLanguages.map((l) => (
                <option key={l.code} value={l.code} disabled={!l.hasVoice}>
                  {l.name} {!l.hasVoice ? '(Chưa hỗ trợ voice)' : ''}
                </option>
              ))
            : availableLanguages
                .filter((item) => item.isActive)
                .map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
        </select>
      </label>
    </header>
  );
}

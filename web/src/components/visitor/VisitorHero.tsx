/**
 * @file VisitorHero.tsx
 * @description Khung giới thiệu chào mừng đầu trang chủ: Slogan 2 dòng, nút "Khám phá địa điểm" và nút "Xem trên bản đồ".
 * @screen Phần trên cùng của Trang chủ khách tham quan (Visitor Home).
 * @activityDiagram Bước khởi đầu trải nghiệm của khách tham quan.
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Đổi chữ slogan: Sửa `copy.heroLine1`, `copy.heroLine2`, `copy.heroSubtitle` trong `visitorCopy.ts`.
 *  - Đổi màu sắc hoặc thêm nút bấm: Thẻ `<div className="visitor-hero-copy">`.
 */

import type { VisitorCopy } from '../../constants/visitorCopy';

type VisitorHeroProps = {
  copy: VisitorCopy;
  onViewMap: () => void;
};

// [TÍNH NĂNG: Khung chào mừng Hero Banner trang chủ]
export function VisitorHero({ copy, onViewMap }: VisitorHeroProps) {
  return (
    <section className="visitor-hero">
      <div className="visitor-hero-copy">
        <h1>
          {copy.heroLine1}
          <br />
          {copy.heroLine2}
        </h1>
        <p>{copy.heroSubtitle}</p>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <a className="visitor-primary" href="#visitor-places">
            {copy.explore} <span aria-hidden="true">&#x2193;</span>
          </a>
          <button
            type="button"
            className="visitor-primary"
            style={{ background: 'var(--paper)', color: 'var(--ink)' }}
            onClick={onViewMap}
          >
            🗺️ {copy.viewMap}
          </button>
        </div>
      </div>
    </section>
  );
}

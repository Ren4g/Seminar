/**
 * @file VisitorHero.tsx
 * @description Khung giới thiệu chào mừng đầu trang chủ: Slogan 2 dòng, nút "Khám phá địa điểm" và nút "Xem trên bản đồ".
 * @screen Phần trên cùng của Trang chủ khách tham quan (Visitor Home).
 * @activityDiagram Bước khởi đầu trải nghiệm của khách tham quan.
 */

import type { VisitorCopy } from '../../constants/visitorCopy';

type VisitorHeroProps = {
  copy: VisitorCopy;
  onViewMap: () => void;
};

// [TÍNH NĂNG: Khung chào mừng Hero Banner trang chủ]
export function VisitorHero({ copy, onViewMap }: VisitorHeroProps) {
  return (
    <div className="visitor-hero-copy">
      <h1>
        {copy.heroLine1}
        <br />
        {copy.heroLine2}
      </h1>
      <p>{copy.heroSubtitle}</p>
      <div className="visitor-hero-actions">
        <a className="visitor-primary" href="#visitor-places">
          {copy.explore} <span aria-hidden="true">&#x2193;</span>
        </a>
        <button
          type="button"
          className="visitor-secondary"
          onClick={onViewMap}
        >
          <span className="icon" aria-hidden="true">⌖</span>
          <span>{copy.viewMap}</span>
        </button>
      </div>
    </div>
  );
}

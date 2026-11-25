/**
 * @file VisitorDetailActions.tsx
 * @description Các tác vụ ở chân màn hình chi tiết: Gợi ý điểm tham quan tiếp theo, nút chia sẻ (Web Share) và liên kết báo lỗi nội dung.
 * @screen Nằm dưới cùng của Màn hình chi tiết điểm tham quan (Visitor Detail).
 * @activityDiagram Bước "Khách chuyển tiếp sang điểm kế tiếp hoặc chia sẻ cho bạn bè".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Chia sẻ liên kết: Sự kiện `navigator.share` hoặc clipboard.
 *  - Email báo lỗi: Đường dẫn `mailto:` trong thẻ `<a>`.
 */

import type { ApiPoi } from '../../api';

type VisitorDetailActionsProps = {
  nextPoi?: ApiPoi;
  locationName: string;
  language: string;
  contentTitle: string;
  translate: (translations: { languageCode: string; name: string }[]) => string;
};

// [TÍNH NĂNG: Các tác vụ chuyển điểm tiếp theo, chia sẻ và báo lỗi]
export function VisitorDetailActions({
  nextPoi,
  locationName,
  language,
  contentTitle,
  translate,
}: VisitorDetailActionsProps) {
  const isVi = language === 'vi';

  return (
    <>
      {/* [TÍNH NĂNG: Gợi ý điểm tham quan tiếp theo trong cùng khu di tích] */}
      {nextPoi && (
        <a className="visitor-next-poi" href={`/visitor?poiId=${nextPoi.id}&language=${language}`}>
          <span className="visitor-kicker">
            {isVi ? 'Điểm tiếp theo trong' : 'Next point in'} {locationName}
          </span>
          <strong>{translate(nextPoi.translations)}</strong>
          <span aria-hidden="true">&#x2192;</span>
        </a>
      )}

      {/* [TÍNH NĂNG: Nút chia sẻ Web Share API & Link báo lỗi] */}
      <div className="visitor-detail-actions">
        <button
          type="button"
          onClick={() => {
            if (navigator.share) void navigator.share({ title: contentTitle, url: window.location.href });
            else void navigator.clipboard?.writeText(window.location.href);
          }}
        >
          {isVi ? 'Chia sẻ' : 'Share'}
        </button>
        <a
          href={`mailto:?subject=${encodeURIComponent(
            isVi ? 'Báo lỗi nội dung' : 'Report content issue'
          )}&body=${encodeURIComponent(window.location.href)}`}
        >
          {isVi ? 'Báo lỗi nội dung' : 'Report an issue'}
        </a>
      </div>
    </>
  );
}

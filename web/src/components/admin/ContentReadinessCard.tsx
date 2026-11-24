/**
 * @file ContentReadinessCard.tsx
 * @description Khung kiểm tra 4 điều kiện tiên quyết để gửi duyệt bài viết (Tiêu đề, Văn bản, Audio hợp lệ, Hoàn tất rà soát) kèm nút xác nhận rà soát.
 * @screen Nằm dưới khung soạn thảo trong Content Studio.
 * @activityDiagram Bước "Kiểm tra điều kiện chất lượng nội dung trước khi gửi duyệt".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Nút xác nhận rà soát: Thẻ `<button className="primary-button">`.
 *  - 4 tiêu chí kiểm tra: Khối `<ul>` bên dưới.
 */

import type { ContentItem } from '../../types/content';

type ContentReadinessCardProps = {
  selected: ContentItem;
  editTitle: string;
  editBody: string;
  audioReady: boolean;
  onConfirmReviewed: () => void;
};

// [TÍNH NĂNG: Khung kiểm tra 4 điều kiện gửi duyệt nội dung]
export function ContentReadinessCard({
  selected,
  editTitle,
  editBody,
  audioReady,
  onConfirmReviewed,
}: ContentReadinessCardProps) {
  const hasTitle = Boolean(editTitle.trim());
  const hasBody = Boolean(editBody.trim());
  const reviewCompleted = !selected.needsReview;

  return (
    <section className="readiness-card">
      <div>
        <strong>Điều kiện gửi duyệt</strong>
        <span>Hoàn tất các mục còn thiếu trước khi gửi duyệt.</span>
      </div>

      {/* [TÍNH NĂNG: Danh sách 4 tiêu chuẩn bắt buộc] */}
      <ul>
        <li className={hasTitle ? 'is-ready' : 'is-missing'}>
          {hasTitle ? <span>✓</span> : <span>○</span>} Có tiêu đề
        </li>
        <li className={hasBody ? 'is-ready' : 'is-missing'}>
          {hasBody ? <span>✓</span> : <span>○</span>} Có văn bản
        </li>
        <li className={audioReady ? 'is-ready' : 'is-missing'}>
          {audioReady ? <span>✓</span> : <span>○</span>} Audio hợp lệ, mới nhất
        </li>
        <li className={reviewCompleted ? 'is-ready' : 'is-missing'}>
          {reviewCompleted ? <span>✓</span> : <span>○</span>} Đã hoàn tất rà soát
        </li>
      </ul>

      {/* [TÍNH NĂNG: Nút xác nhận đã hoàn tất rà soát bản dịch AI] */}
      {selected.needsReview && (
        <button type="button" className="primary-button" onClick={onConfirmReviewed}>
          Xác nhận đã rà soát
        </button>
      )}
    </section>
  );
}

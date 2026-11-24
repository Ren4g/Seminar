/**
 * @file VisitorPreviewModal.tsx
 * @description Hộp thoại xem trước giao diện và nghe thử bài thuyết minh như một khách tham quan thực tế.
 * @screen Nút "Xem trước như visitor" trong Content Studio.
 * @activityDiagram Bước "Xem trước trải nghiệm người dùng trước khi gửi duyệt".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Giao diện preview: Class `.visitor-overlay`, `.visitor-card` trong `styles.css`.
 */

import type { ContentItem } from '../../types/content';

type VisitorPreviewModalProps = {
  selected: ContentItem;
  onClose: () => void;
};

// [TÍNH NĂNG: Modal xem trước bài thuyết minh dưới góc nhìn Visitor]
export function VisitorPreviewModal({ selected, onClose }: VisitorPreviewModalProps) {
  return (
    <div className="visitor-overlay" role="dialog" aria-modal="true" aria-labelledby="visitor-title">
      <div className="visitor-card">
        <button type="button" className="close-button" aria-label="Đóng preview" onClick={onClose}>
          ×
        </button>
        <span className="visitor-label">Visitor preview · {selected.language}</span>
        <h2 id="visitor-title">{selected.title}</h2>
        <p>{selected.body}</p>
        <div className="visitor-player">
          {selected.audioUrl ? (
            <audio controls preload="metadata" src={selected.audioUrl} aria-label="Audio thuyết minh" />
          ) : (
            <p className="empty-state">Chưa có audio thực. Hãy upload file hoặc tạo bằng ElevenLabs.</p>
          )}
        </div>
      </div>
    </div>
  );
}

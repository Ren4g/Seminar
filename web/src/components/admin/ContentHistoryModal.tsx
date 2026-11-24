/**
 * @file ContentHistoryModal.tsx
 * @description Hộp thoại xem lịch sử workflow của bài viết: Danh sách các sự kiện duyệt, từ chối, lý do từ chối, người thực hiện và thời gian.
 * @screen Nút "Lịch sử duyệt" trong Content Studio.
 * @activityDiagram Bước "Kiểm toán lịch sử phê duyệt và lý do từ chối".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Định dạng hiển thị sự kiện: Khối `<div className="history-row">`.
 */

import type { ApiReviewEvent } from '../../api';

type ContentHistoryModalProps = {
  history: ApiReviewEvent[];
  onClose: () => void;
};

// [TÍNH NĂNG: Modal xem lịch sử quy trình phê duyệt workflow]
export function ContentHistoryModal({ history, onClose }: ContentHistoryModalProps) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="history-title">
      <div className="modal-card history-card">
        <button type="button" className="close-button" aria-label="Đóng lịch sử" onClick={onClose}>
          ×
        </button>
        <h2 id="history-title">Lịch sử workflow.</h2>
        <div className="history-list">
          {history.length ? (
            history.map((event) => (
              <div className="history-row" key={`${event.eventType}-${event.actedAt}`}>
                <strong>{event.eventType}</strong>
                <span>{new Date(event.actedAt).toLocaleString('vi-VN')}</span>
                <small>{event.reason ?? `Actor #${event.actorUserId}`}</small>
              </div>
            ))
          ) : (
            <p className="empty-state">Chưa có lịch sử.</p>
          )}
        </div>
      </div>
    </div>
  );
}

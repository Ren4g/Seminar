/**
 * @file StatusBadge.tsx
 * @description Huy hiệu màu hiển thị trạng thái bài viết (Đã xuất bản, Chờ duyệt, Cần rà soát, Bản nháp).
 * @screen Danh sách bài viết Admin, Chi tiết Content Studio, Bảng điều khiển.
 * @activityDiagram Quản lý vòng đời bài viết -> Trực quan hóa trạng thái phê duyệt.
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Màu sắc tương ứng từng trạng thái: Biến `STATUS_TONES` và class CSS `.status--published`, `.status--review`, `.status--attention` trong `styles.css`.
 */

import type { Status } from '../../types/content';

// ==================== CẤU HÌNH MÀU SẮC TRẠNG THÁI ====================
const STATUS_TONES: Record<Status, string> = {
  'Đã xuất bản': 'published',
  'Chờ duyệt': 'review',
  'Đã duyệt': 'review',
  'Cần rà soát': 'attention',
  'Bị từ chối': 'attention',
  'Đang soạn': 'draft',
  'Đã gỡ xuất bản': 'draft',
};

// [TÍNH NĂNG: Huy hiệu trạng thái bài viết]
export function StatusBadge({ status }: { status: Status }) {
  const tone = STATUS_TONES[status] ?? 'draft';
  return <span className={`status status--${tone}`}>{status}</span>;
}

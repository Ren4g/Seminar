/**
 * @file content.ts
 * @description Định nghĩa các kiểu dữ liệu cho bài thuyết minh (ContentItem) và trạng thái vòng đời (Status).
 * @screen Toàn bộ hệ thống (dùng chung cho cả Visitor và Admin Content Studio).
 * @activityDiagram Quản lý vòng đời bài viết: Soạn thảo -> Rà soát -> Gửi duyệt -> Duyệt -> Xuất bản.
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Thêm trạng thái bài viết mới: Mở rộng type `Status`
 *  - Thêm trường dữ liệu cho bài viết (ví dụ: tác giả, thẻ tag): Mở rộng type `ContentItem`
 */

// [TÍNH NĂNG: Quản lý trạng thái bài viết]
export type Status =
  | 'Đang soạn'
  | 'Chờ duyệt'
  | 'Đã duyệt'
  | 'Đã xuất bản'
  | 'Đã gỡ xuất bản'
  | 'Cần rà soát'
  | 'Bị từ chối';

// [TÍNH NĂNG: Cấu trúc dữ liệu bài thuyết minh]
export type ContentItem = {
  id: number;
  title: string;
  place: string;
  language: string;
  status: Status;
  updated: string;
  duration: string;
  body: string;
  versionId?: number;
  versionNumber?: number;
  poiId?: number;
  hasAudio?: boolean;
  needsReview?: boolean;
  rawStatus?: string;
  languageCode?: string;
  sourceTitle?: string;
  sourceBody?: string;
  audioUrl?: string;
};

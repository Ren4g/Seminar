/**
 * @file formatters.ts
 * @description Các hàm tiện ích chuyển đổi dữ liệu hiển thị (mapContent, tên ngôn ngữ, định dạng phút:giây).
 * @screen Dùng chung cho cả Visitor và Admin Content Studio.
 * @activityDiagram Hiển thị bài viết -> Chuẩn hóa định dạng thời lượng và trạng thái.
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Quy tắc ánh xạ trạng thái từ Backend sang nhãn tiếng Việt: Hàm `mapContent()`.
 *  - Định dạng hiển thị thời gian phát audio: Hàm `formatTime()`.
 */

import { API_URL, type ApiContent } from '../api';
import type { ContentItem, Status } from '../types/content';

/**
 * [TÍNH NĂNG: Ánh xạ dữ liệu bài thuyết minh từ API sang kiểu hiển thị trên giao diện]
 */
export function mapContent(item: ApiContent, index: number): ContentItem {
  const status: Status =
    item.status === 'PENDING_REVIEW'
      ? 'Chờ duyệt'
      : item.status === 'APPROVED'
      ? 'Đã duyệt'
      : item.status === 'PUBLISHED'
      ? 'Đã xuất bản'
      : item.status === 'UNPUBLISHED'
      ? 'Đã gỡ xuất bản'
      : item.status === 'REJECTED'
      ? 'Bị từ chối'
      : 'Đang soạn';

  const audioValid = Boolean(item.audio && item.audio.isValid && !item.audio.isOutdated);
  const audioUrl =
    audioValid && item.audio?.filePath.startsWith('/media/')
      ? `${API_URL.replace(/\/api\/?$/, '')}${item.audio.filePath}`
      : undefined;

  return {
    id: Number(item.versionId ?? index + 1),
    title: item.title,
    place: `POI #${item.poiId}`,
    language: item.languageCode.toUpperCase(),
    languageCode: item.languageCode,
    rawStatus: item.status,
    status,
    updated: 'Vừa cập nhật',
    duration: item.audio ? '02:34' : '--',
    body: item.narrationText,
    versionId: item.versionId,
    versionNumber: item.versionNumber,
    poiId: item.poiId,
    needsReview: Boolean(item.needsReview),
    hasAudio: audioValid,
    audioUrl,
  };
}

/**
 * [TÍNH NĂNG: Hiển thị tên ngôn ngữ bản địa hóa từ mã ISO (vi -> Tiếng Việt, en -> English)]
 */
export function languageName(code: string, locale = 'vi'): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'language' }).of(code) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

/**
 * [TÍNH NĂNG: Định dạng số giây thành chuỗi thời gian phút:giây (ví dụ 154 -> 02:34)]
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = String(Math.floor(seconds % 60)).padStart(2, '0');
  return `${mins}:${secs}`;
}

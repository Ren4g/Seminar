/**
 * @file session.ts
 * @description Quản lý khóa phiên truy cập ẩn danh của khách tham quan và sinh UUID an toàn.
 * @screen Toàn bộ giao diện Visitor (Heartbeat, Analytics, Lịch sử nghe).
 * @activityDiagram Ghi nhận sự kiện truy cập (PAGE_VIEW, QR_OPEN, PRESENCE).
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Tên key lưu trữ phiên trong sessionStorage: Biến `SESSION_STORAGE_KEY`.
 */

// ==================== CẤU HÌNH PHIÊN KHÁCH ====================
const SESSION_STORAGE_KEY = 'audio-guide-session';

/**
 * [TÍNH NĂNG: Sinh mã định danh UUID ngẫu nhiên tương thích mọi trình duyệt]
 */
export function safeRandomUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * [TÍNH NĂNG: Lấy hoặc tạo mới Session Key cho khách tham quan trong phiên trình duyệt]
 */
export function getVisitorSessionKey(): string {
  const existing = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;
  const created = safeRandomUUID();
  sessionStorage.setItem(SESSION_STORAGE_KEY, created);
  return created;
}

/**
 * @file VisitorFooter.tsx
 * @description Chân trang của giao diện khách tham quan (Bản quyền & Slogan hệ thống).
 * @screen Toàn bộ giao diện khách tham quan (Visitor Footer).
 * @activityDiagram Hiển thị thông tin chân trang.
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Đổi chữ chân trang: Sửa thuộc tính `copy.footer` trong `visitorCopy.ts`.
 */

import type { VisitorCopy } from '../../constants/visitorCopy';

// [TÍNH NĂNG: Chân trang giao diện Visitor]
export function VisitorFooter({ copy }: { copy: VisitorCopy }) {
  return (
    <footer className="visitor-footer">
      <a href="/">audio guide</a>
      <span>{copy.footer}</span>
    </footer>
  );
}

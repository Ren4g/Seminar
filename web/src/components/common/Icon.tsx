/**
 * @file Icon.tsx
 * @description Thành phần hiển thị biểu tượng icon dùng chung có thẻ span trợ năng.
 * @screen Toàn bộ hệ thống.
 * @activityDiagram Hiển thị trực quan các biểu tượng menu và nút bấm.
 */

import type { ReactNode } from 'react';

// [TÍNH NĂNG: Component icon bọc thẻ trợ năng]
export function Icon({ children }: { children: ReactNode }) {
  return (
    <span className="icon" aria-hidden="true">
      {children}
    </span>
  );
}

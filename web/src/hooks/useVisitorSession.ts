/**
 * @file useVisitorSession.ts
 * @description Hook quản lý phiên truy cập ẩn danh: Gửi heartbeat định kỳ đếm khách online và ghi nhận sự kiện PAGE_VIEW, QR_OPEN.
 * @screen Toàn bộ giao diện khách tham quan (Visitor).
 * @activityDiagram Bước "Ghi nhận sự kiện truy cập và nhịp tim người dùng trực tuyến".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Chu kỳ gửi heartbeat: Biến `HEARTBEAT_INTERVAL_MS`.
 */

import { useEffect } from 'react';
import { api } from '../api';
import { getVisitorSessionKey, safeRandomUUID } from '../utils/session';

const HEARTBEAT_INTERVAL_MS = 30_000;

// [TÍNH NĂNG: Hook theo dõi phiên truy cập và gửi sự kiện Analytics]
export function useVisitorSession(poiId: number | null, language: string, isQrSource: boolean) {
  // [TÍNH NĂNG: Gửi nhịp tim Presence đếm khách online]
  useEffect(() => {
    const sessionKey = getVisitorSessionKey();
    const sendHeartbeat = () => {
      if (document.visibilityState !== 'visible') return;
      void api.recordPresence({ anonymousSessionKey: sessionKey }).catch(() => undefined);
    };
    sendHeartbeat();
    const timer = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    document.addEventListener('visibilitychange', sendHeartbeat);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', sendHeartbeat);
    };
  }, []);

  // [TÍNH NĂNG: Ghi nhận sự kiện xem trang và quét mã QR]
  useEffect(() => {
    const sessionKey = getVisitorSessionKey();
    void api.recordEvent({
      eventId: safeRandomUUID(),
      eventType: 'PAGE_VIEW',
      poiId: poiId ?? undefined,
      languageCode: language,
      anonymousSessionKey: sessionKey,
    }).catch(() => undefined);

    if (isQrSource) {
      void api.recordEvent({
        eventId: safeRandomUUID(),
        eventType: 'QR_OPEN',
        poiId: poiId ?? undefined,
        languageCode: language,
        anonymousSessionKey: sessionKey,
      }).catch(() => undefined);
    }
  }, [poiId]);
}

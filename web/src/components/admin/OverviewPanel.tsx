/**
 * @file OverviewPanel.tsx
 * @description Màn hình "Tổng quan": Các ô số liệu thống kê bài viết, POI, giọng đọc, analytics và khách đang truy cập trực tiếp.
 * @screen Tab "Tổng quan" trong trang quản trị Admin.
 * @activityDiagram Bước "Theo dõi hiệu năng và mức độ tương tác của hệ thống thuyết minh".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Chu kỳ làm mới số liệu analytics: Biến `ANALYTICS_INTERVAL_MS` bên dưới.
 *  - Thêm thẻ số liệu thống kê mới: Thêm thẻ `<article>` trong `<div className="overview-metrics">`.
 */

import { useEffect, useState } from 'react';
import { api, type ApiAnalytics, type ApiPoi, type ApiVoice } from '../../api';
import type { ContentItem } from '../../types/content';

// ==================== CẤU HÌNH LÀM MỚI ANALYTICS ====================
const ANALYTICS_INTERVAL_MS = 30_000;

type OverviewPanelProps = {
  items: ContentItem[];
  pois: ApiPoi[];
  voices: ApiVoice[];
  token: string;
};

// [TÍNH NĂNG: Bảng điều khiển Tổng quan số liệu hệ thống]
export function OverviewPanel({ items, pois, voices, token }: OverviewPanelProps) {
  const [analytics, setAnalytics] = useState<ApiAnalytics | null>(null);

  // [TÍNH NĂNG: Tự động cập nhật số liệu thống kê từ Backend mỗi 30s]
  useEffect(() => {
    let mounted = true;
    const refresh = () => {
      void api.analyticsSummary(token)
        .then((result) => {
          if (mounted) setAnalytics(result);
        })
        .catch(() => undefined);
    };
    refresh();
    const timer = window.setInterval(refresh, ANALYTICS_INTERVAL_MS);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [token]);

  const published = items.filter((item) => item.status === 'Đã xuất bản').length;
  const review = items.filter((item) => item.status === 'Chờ duyệt').length;

  return (
    <section className="overview-panel">
      <div className="overview-intro">
        <h2>Hệ thống đang giữ nhịp cho những câu chuyện địa phương.</h2>
        <p className="overview-range">
          {analytics ? `${analytics.windowDays} ngày gần nhất` : 'Đang tải analytics'}
        </p>
        <p>Kiểm tra nội dung, audio và điểm truy cập visitor từ một nơi.</p>
      </div>

      {/* [TÍNH NĂNG: Lưới hiển thị các thẻ số liệu thống kê] */}
      <div className="overview-metrics">
        <article>
          <strong>{items.length}</strong>
          <span>phiên bản nội dung</span>
        </article>
        <article>
          <strong>{published}</strong>
          <span>đã xuất bản</span>
        </article>
        <article>
          <strong>{review}</strong>
          <span>chờ duyệt</span>
        </article>
        <article>
          <strong>{pois.length}</strong>
          <span>điểm tham quan · {voices.length} giọng đọc</span>
        </article>
        <article>
          <strong>{analytics?.pageViews ?? '—'}</strong>
          <span>lượt mở visitor</span>
        </article>
        <article>
          <strong>{analytics?.qrOpens ?? '—'}</strong>
          <span>lượt mở QR</span>
        </article>
        <article>
          <strong>{analytics?.audioStarts ?? '—'}</strong>
          <span>lượt bắt đầu audio</span>
        </article>
        <article>
          <strong>{analytics ? `${Math.round(analytics.listeningMs / 60000)}m` : '—'}</strong>
          <span>thời lượng nghe</span>
        </article>
        <article>
          <strong>{analytics?.activeVisitors ?? '—'}</strong>
          <span>đang truy cập · 2 phút gần nhất</span>
        </article>
      </div>

      <div className="overview-actions">
        <button type="button" className="quiet-button" onClick={() => window.open('/visitor', '_blank')}>
          Mở trang visitor <span>↗</span>
        </button>
        <span>Analytics lấy trực tiếp từ activity_event; lượt đang truy cập cập nhật mỗi 30 giây.</span>
      </div>
    </section>
  );
}

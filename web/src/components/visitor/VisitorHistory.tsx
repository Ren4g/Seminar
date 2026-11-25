/**
 * @file VisitorHistory.tsx
 * @description Danh sách lịch sử nghe thuyết minh đã lưu trên trình duyệt của khách (LocalStorage).
 * @screen Nằm ở cuối Trang chủ của khách tham quan.
 * @activityDiagram Bước "Khách xem lại các điểm đã nghe trước đó" -> "Nghe lại hoặc xóa lịch sử".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Nút xóa tất cả lịch sử: Hàm `onClearHistory()`.
 *  - Nút xóa 1 mục khỏi lịch sử: Hàm `onRemoveItem()`.
 */

import type { MouseEvent } from 'react';
import type { VisitorCopy } from '../../constants/visitorCopy';

type HistoryItem = {
  title: string;
  poiId: number;
  listenedAt: string;
};

type VisitorHistoryProps = {
  history: HistoryItem[];
  language: string;
  copy: VisitorCopy;
  onClearHistory: () => void;
  onRemoveItem: (poiId: number, event: MouseEvent) => void;
};

// [TÍNH NĂNG: Khung lịch sử nghe trên thiết bị]
export function VisitorHistory({
  history,
  language,
  copy,
  onClearHistory,
  onRemoveItem,
}: VisitorHistoryProps) {
  if (history.length === 0) return null;

  return (
    <section className="visitor-home-section visitor-recent">
      <div className="visitor-home-heading">
        <div>
          <h2>{copy.historyHeading}</h2>
        </div>
        <button type="button" className="quiet-button" onClick={onClearHistory}>
          {copy.clearHistory}
        </button>
      </div>

      {history.map((item) => (
        <a
          className="visitor-history-row"
          key={item.poiId}
          href={`/visitor?poiId=${item.poiId}&language=${language}`}
        >
          <span>{item.title}</span>
          <small>
            {new Date(item.listenedAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
          </small>
          <button
            type="button"
            className="history-remove-btn"
            title={copy.removeHistory}
            aria-label={copy.removeHistory}
            onClick={(event) => onRemoveItem(item.poiId, event)}
          >
            &times;
          </button>
          <span aria-hidden="true">&#x2197;</span>
        </a>
      ))}
    </section>
  );
}

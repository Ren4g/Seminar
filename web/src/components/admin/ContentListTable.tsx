/**
 * @file ContentListTable.tsx
 * @description Hiển thị danh sách bài thuyết minh dạng danh sách hàng ngang (Mã ngôn ngữ, Tiêu đề, Tên POI, Huy hiệu trạng thái, Thời gian cập nhật).
 * @screen Tab "Nội dung" ở chế độ xem danh sách (list view).
 * @activityDiagram Bước "Chọn bài viết cần xem chi tiết hoặc chỉnh sửa".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Click chọn bài viết: Sự kiện `onClick` của `<button className="content-row">`.
 *  - Cấu trúc từng hàng: Thẻ `.row-index`, `.row-main`, `.row-meta`, `.row-time`.
 */

import type { ApiPoi } from '../../api';
import type { ContentItem } from '../../types/content';
import { languageName } from '../../utils/formatters';
import { StatusBadge } from '../common/StatusBadge';

type ContentListTableProps = {
  items: ContentItem[];
  pois: ApiPoi[];
  onSelectItem: (item: ContentItem) => void;
};

// [TÍNH NĂNG: Danh sách bài thuyết minh dạng hàng ngang]
export function ContentListTable({ items, pois, onSelectItem }: ContentListTableProps) {
  return (
    <div className="list-items">
      {items.map((item) => {
        const poiName =
          pois.find((poi) => poi.id === item.poiId)?.translations.find((t) => t.languageCode === 'en')?.name ??
          item.place;

        return (
          <button
            type="button"
            className="content-row"
            key={item.versionId ?? item.id}
            onClick={() => onSelectItem(item)}
          >
            <span className="row-index">{item.languageCode?.toUpperCase()}</span>
            <span className="row-main">
              <strong>{item.title}</strong>
              <small>{poiName}</small>
            </span>
            <span className="row-meta">
              <span className="language-chip">{languageName(item.languageCode ?? item.language)}</span>
              <StatusBadge status={item.status} />
            </span>
            <span className="row-time">{item.updated}</span>
          </button>
        );
      })}
    </div>
  );
}

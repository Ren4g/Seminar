/**
 * @file ContentFilters.tsx
 * @description Thanh công cụ lọc bài viết: Các tab trạng thái (Tất cả, Bản nháp, Chờ duyệt, Bị từ chối, Cần rà soát, Đã xuất bản), ô tìm kiếm và nút chuyển đổi xem Danh sách / Ma trận.
 * @screen Trên cùng của danh sách bài viết trong Content Studio.
 * @activityDiagram Bước "Tìm kiếm và phân loại bài viết theo trạng thái phê duyệt".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Danh sách tab lọc: Mảng `FILTER_TABS` bên dưới.
 *  - Nút chuyển chế độ xem: `<button className="quiet-button">`.
 */

import { Icon } from '../common/Icon';
import type { ContentItem } from '../../types/content';

export type StatusFilterType = 'ALL' | 'DRAFT' | 'PENDING_REVIEW' | 'REJECTED' | 'NEEDS_REVIEW' | 'PUBLISHED';

// ==================== CẤU HÌNH CÁC TAB LỌC TRẠNG THÁI ====================
const FILTER_TABS: [StatusFilterType, string][] = [
  ['ALL', 'Tất cả'],
  ['DRAFT', 'Bản nháp'],
  ['PENDING_REVIEW', 'Chờ duyệt'],
  ['REJECTED', 'Bị từ chối'],
  ['NEEDS_REVIEW', 'Cần rà soát'],
  ['PUBLISHED', 'Đã xuất bản'],
];

type ContentFiltersProps = {
  statusFilter: StatusFilterType;
  search: string;
  viewMode: 'list' | 'matrix';
  items: ContentItem[];
  onSelectStatus: (status: StatusFilterType) => void;
  onSearchChange: (search: string) => void;
  onToggleViewMode: () => void;
};

// [TÍNH NĂNG: Bộ lọc bài viết và tìm kiếm nội dung]
export function ContentFilters({
  statusFilter,
  search,
  viewMode,
  items,
  onSelectStatus,
  onSearchChange,
  onToggleViewMode,
}: ContentFiltersProps) {
  return (
    <div className="list-toolbar">
      {/* [TÍNH NĂNG: Các tab lọc theo trạng thái vòng đời bài viết] */}
      <div className="content-filters" role="tablist" aria-label="Filter by status">
        {FILTER_TABS.map(([value, label]) => {
          const count =
            value === 'ALL'
              ? items.length
              : items.filter((item) =>
                  value === 'NEEDS_REVIEW' ? item.needsReview : item.rawStatus === value
                ).length;
          return (
            <button
              key={value}
              className={statusFilter === value ? 'is-selected' : ''}
              onClick={() => onSelectStatus(value)}
            >
              {label}
              <span>{count}</span>
            </button>
          );
        })}
      </div>

      {/* [TÍNH NĂNG: Ô tìm kiếm và nút chuyển đổi Danh sách / Ma trận] */}
      <div className="list-tools">
        <label className="search-control">
          <Icon>&#x2315;</Icon>
          <input
            aria-label="Tìm kiếm nội dung"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm kiếm nội dung"
          />
        </label>
        <button type="button" className="quiet-button" onClick={onToggleViewMode}>
          {viewMode === 'list' ? 'Xem ma trận' : 'Xem danh sách'}
        </button>
      </div>
    </div>
  );
}

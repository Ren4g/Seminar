/**
 * @file ContentMatrixTable.tsx
 * @description Bảng ma trận đối chiếu bài viết: Các dòng là Điểm tham quan (POI) và các cột là Ngôn ngữ (Tiếng Việt, Tiếng Anh).
 * @screen Tab "Nội dung" ở chế độ xem ma trận (matrix view).
 * @activityDiagram Bước "Đánh giá độ phủ ngôn ngữ của các điểm tham quan".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Danh sách cột ngôn ngữ ma trận: Mảng `MATRIX_LANGUAGES` bên dưới.
 *  - Ô chưa có nội dung: Nút `.matrix-cell.is-empty`.
 */

import type { ApiPoi } from '../../api';
import type { ContentItem } from '../../types/content';

// ==================== CẤU HÌNH CỘT MA TRẬN NGÔN NGỮ ====================
const MATRIX_LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'en', label: 'Tiếng Anh' },
];

type ContentMatrixTableProps = {
  pois: ApiPoi[];
  items: ContentItem[];
  onSelectCell: (item: ContentItem) => void;
  onEmptyCellClick: () => void;
};

// [TÍNH NĂNG: Bảng ma trận đối chiếu ngôn ngữ theo từng POI]
export function ContentMatrixTable({
  pois,
  items,
  onSelectCell,
  onEmptyCellClick,
}: ContentMatrixTableProps) {
  return (
    <div className="content-matrix">
      <div className="matrix-row matrix-head">
        <strong>Điểm tham quan</strong>
        {MATRIX_LANGUAGES.map((lang) => (
          <span key={lang.code}>{lang.label}</span>
        ))}
      </div>

      {pois.map((poi) => (
        <div className="matrix-row" key={poi.id}>
          <strong>
            {poi.translations.find((t) => t.languageCode === 'en')?.name ?? `POI #${poi.id}`}
          </strong>

          {MATRIX_LANGUAGES.map((lang) => {
            const cell = items.find((item) => item.poiId === poi.id && item.languageCode === lang.code);
            return cell ? (
              <button
                type="button"
                key={lang.code}
                className="matrix-cell"
                onClick={() => onSelectCell(cell)}
              >
                {cell.needsReview ? 'Cần rà soát' : cell.status}
              </button>
            ) : (
              <button
                type="button"
                key={lang.code}
                className="matrix-cell is-empty"
                onClick={onEmptyCellClick}
              >
                Chưa có
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/**
 * @file ContentDetailStudio.tsx
 * @description Khung biên tập nội dung bài thuyết minh: Quy trình 4 bước (Draft -> Translate -> Audio -> Submit), cột bài nguồn đối chiếu (chỉ đọc) và cột chỉnh sửa tiêu đề/văn bản.
 * @screen Màn hình chi tiết Content Studio khi chọn 1 bài viết.
 * @activityDiagram Bước "Biên soạn nội dung" -> "Đối chiếu bản dịch song ngữ".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Cột chỉnh sửa: Ô input tiêu đề và textarea nội dung thuyết minh.
 *  - Thanh 4 bước quy trình: Khối `<div className="studio-steps">`.
 */

import type { ApiPoi } from '../../api';
import type { ContentItem } from '../../types/content';
import { languageName } from '../../utils/formatters';
import { StatusBadge } from '../common/StatusBadge';

type ContentDetailStudioProps = {
  selected: ContentItem;
  sourceCounterpart?: ContentItem;
  pois: ApiPoi[];
  editTitle: string;
  editBody: string;
  isDirty: boolean;
  fieldsReady: boolean;
  audioReady: boolean;
  onEditTitleChange: (title: string) => void;
  onEditBodyChange: (body: string) => void;
  onBackToList: () => void;
};

// [TÍNH NĂNG: Khung biên tập nội dung đối chiếu song ngữ]
export function ContentDetailStudio({
  selected,
  sourceCounterpart,
  pois,
  editTitle,
  editBody,
  isDirty,
  fieldsReady,
  audioReady,
  onEditTitleChange,
  onEditBodyChange,
  onBackToList,
}: ContentDetailStudioProps) {
  const isEditable = ['DRAFT', 'REJECTED'].includes(selected.rawStatus ?? '');
  const poiPlaceName =
    pois.find((poi) => poi.id === selected.poiId)?.translations.find((t) => t.languageCode === 'en')?.name ??
    selected.place;

  return (
    <>
      <button type="button" className="detail-back quiet-button" onClick={onBackToList}>
        ← Quay lại danh sách
      </button>

      {/* [TÍNH NĂNG: Tiêu đề Studio và Huy hiệu trạng thái] */}
      <div className="studio-title-row">
        <div>
          <p className="studio-eyebrow">
            CONTENT STUDIO / {languageName(selected.languageCode ?? selected.language)}
          </p>
          <h2>{selected.title}</h2>
        </div>
        <StatusBadge status={selected.status} />
      </div>

      {/* [TÍNH NĂNG: Thanh hiển thị 4 bước quy trình xuất bản] */}
      <div className="studio-steps">
        <span className={isDirty || !fieldsReady ? 'is-current' : 'is-complete'}>1 Draft</span>
        <span className={selected.needsReview ? 'is-current' : 'is-complete'}>2 Translate</span>
        <span className={!audioReady ? 'is-current' : 'is-complete'}>3 Audio</span>
        <span className={fieldsReady && audioReady && !selected.needsReview && !isDirty ? 'is-current' : ''}>
          4 Submit
        </span>
      </div>

      {/* [TÍNH NĂNG: Lưới 2 cột so sánh bản nguồn và chỉnh sửa bản dịch] */}
      <div className="studio-editor-grid">
        {/* Cột trái: Bản nguồn để đối chiếu */}
        <section className="source-column">
          <div className="column-heading">
            <div>
              <small>Bản nguồn / Chỉ đọc</small>
              <strong>{sourceCounterpart?.title ?? 'No source version to compare'}</strong>
            </div>
            <span>{sourceCounterpart?.languageCode ? languageName(sourceCounterpart.languageCode) : ''}</span>
          </div>
          <p className="source-copy">
            {sourceCounterpart?.body ?? 'The source text appears here for translated versions.'}
          </p>
          <small className="character-count">
            {(sourceCounterpart?.body ?? '').length.toLocaleString('vi-VN')} characters
          </small>
        </section>

        {/* Cột phải: Bản đang soạn có thể chỉnh sửa */}
        <section className="translation-column">
          <div className="column-heading">
            <div>
              <small>Bản đang soạn / Có thể chỉnh sửa</small>
              <strong>{poiPlaceName}</strong>
            </div>
            <span>{languageName(selected.languageCode ?? selected.language)}</span>
          </div>

          <label className="editor-field">
            Tiêu đề
            <input
              value={editTitle}
              onChange={(event) => onEditTitleChange(event.target.value)}
              disabled={!isEditable}
            />
          </label>

          <label className="editor-field">
            Nội dung thuyết minh
            <textarea
              value={editBody}
              onChange={(event) => onEditBodyChange(event.target.value)}
              disabled={!isEditable}
              rows={7}
            />
          </label>

          <div className="editor-meta">
            <span>{editBody.length.toLocaleString('vi-VN')} ký tự</span>
          </div>
        </section>
      </div>
    </>
  );
}

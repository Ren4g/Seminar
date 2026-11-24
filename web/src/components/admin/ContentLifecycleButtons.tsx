/**
 * @file ContentLifecycleButtons.tsx
 * @description Các nút chuyển đổi trạng thái vòng đời bài viết: Lưu nháp, Xóa bài, Gửi duyệt, Phê duyệt, Từ chối, Xuất bản, Gỡ xuất bản, Xuất bản lại.
 * @screen Nằm ở nhóm nút tác vụ chính trong Content Studio.
 * @activityDiagram Quản lý vòng đời bài viết: Soạn thảo -> Rà soát -> Gửi duyệt -> Duyệt/Từ chối -> Xuất bản.
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Nút Gửi duyệt: Sự kiện `onTransition('submit')`.
 *  - Nút Duyệt: Sự kiện `onTransition('approve')`.
 *  - Nút Từ chối: Sự kiện `onTransition('reject')`.
 *  - Nút Xuất bản: Sự kiện `onPublish()`.
 */

import type { ContentItem } from '../../types/content';

type ContentLifecycleButtonsProps = {
  selected: ContentItem;
  isDirty: boolean;
  fieldsReady: boolean;
  audioReady: boolean;
  onSaveContent: () => void;
  onDeleteCurrentContent: () => void;
  onTransition: (action: 'submit' | 'withdraw' | 'approve' | 'unpublish' | 'republish' | 'reject') => void;
  onPublish: () => void;
};

// [TÍNH NĂNG: Cụm nút chuyển đổi trạng thái vòng đời bài thuyết minh]
export function ContentLifecycleButtons({
  selected,
  isDirty,
  fieldsReady,
  audioReady,
  onSaveContent,
  onDeleteCurrentContent,
  onTransition,
  onPublish,
}: ContentLifecycleButtonsProps) {
  const isDraftOrRejected = ['DRAFT', 'REJECTED'].includes(selected.rawStatus ?? '');
  const isPublished = selected.rawStatus === 'PUBLISHED';
  const isPendingReview = selected.rawStatus === 'PENDING_REVIEW';
  const isApproved = selected.rawStatus === 'APPROVED';
  const isUnpublished = selected.rawStatus === 'UNPUBLISHED';
  const canSubmit = fieldsReady && audioReady && !selected.needsReview && !isDirty;

  return (
    <>
      {/* [TÍNH NĂNG: Nút Lưu bản nháp khi đang soạn thảo] */}
      {!isPublished && (
        <button
          type="button"
          className={isDirty || !fieldsReady ? 'primary-button' : 'quiet-button'}
          disabled={!fieldsReady}
          onClick={onSaveContent}
        >
          Lưu bản nháp
        </button>
      )}

      {/* [TÍNH NĂNG: Nút Xóa bài viết hoặc bản nháp] */}
      {!isPublished && !isPendingReview && (
        <button
          type="button"
          className="quiet-button"
          style={{ color: 'var(--coral)', borderColor: 'var(--coral)' }}
          onClick={onDeleteCurrentContent}
        >
          {isUnpublished ? 'Xóa bài viết' : 'Xóa bản nháp'}
        </button>
      )}

      {/* [TÍNH NĂNG: Nút Gửi duyệt khi đã thỏa mãn 4 điều kiện] */}
      {isDraftOrRejected && (
        <button
          type="button"
          className={canSubmit ? 'primary-button' : 'quiet-button'}
          disabled={!canSubmit}
          title={
            isDirty
              ? 'Save your edits before submitting.'
              : !audioReady
              ? 'A valid, current audio file is required before submitting.'
              : selected.needsReview
              ? 'Confirm that the translation review is complete.'
              : ''
          }
          onClick={() => onTransition('submit')}
        >
          Gửi duyệt
        </button>
      )}

      {/* [TÍNH NĂNG: Nút Phê duyệt / Từ chối bài viết đang chờ duyệt] */}
      {isPendingReview && (
        <>
          <button type="button" className="primary-button" onClick={() => onTransition('approve')}>
            Duyệt
          </button>
          <button type="button" className="quiet-button" onClick={() => onTransition('reject')}>
            Từ chối
          </button>
        </>
      )}

      {/* [TÍNH NĂNG: Nút Xuất bản bài viết đã được duyệt] */}
      {isApproved && (
        <button type="button" className="primary-button" onClick={onPublish}>
          Xuất bản
        </button>
      )}

      {/* [TÍNH NĂNG: Nút Gỡ bài viết đã xuất bản] */}
      {isPublished && (
        <button type="button" className="quiet-button" onClick={() => onTransition('unpublish')}>
          Gỡ xuất bản
        </button>
      )}

      {/* [TÍNH NĂNG: Nút Xuất bản lại bài viết đã gỡ] */}
      {isUnpublished && (
        <button type="button" className="primary-button" onClick={() => onTransition('republish')}>
          Xuất bản lại
        </button>
      )}
    </>
  );
}

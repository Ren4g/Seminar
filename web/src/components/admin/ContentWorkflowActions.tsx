/**
 * @file ContentWorkflowActions.tsx
 * @description Thanh điều phối toàn bộ cụm tác vụ nghiệp vụ Content Studio: Xem trước, Lịch sử, Dịch tự động, Tải MP3, Tạo ElevenLabs và Chuyển trạng thái workflow.
 * @screen Nằm ở góc dưới của màn hình biên tập Content Studio.
 * @activityDiagram Quản lý vòng đời bài viết: Soạn thảo -> Rà soát -> Gửi duyệt -> Phê duyệt -> Xuất bản.
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Dịch tự động: Thẻ `<ContentTranslateAction />`.
 *  - Thao tác Audio: Thẻ `<ContentAudioAction />`.
 *  - Nút vòng đời (Lưu, Duyệt, Xuất bản): Thẻ `<ContentLifecycleButtons />`.
 */

import type { ChangeEvent } from 'react';
import type { ApiLanguage, ApiVoice } from '../../api';
import type { ContentItem } from '../../types/content';
import { ContentTranslateAction } from './ContentTranslateAction';
import { ContentAudioAction } from './ContentAudioAction';
import { ContentLifecycleButtons } from './ContentLifecycleButtons';

type ContentWorkflowActionsProps = {
  selected: ContentItem;
  items: ContentItem[];
  editBody: string;
  isDirty: boolean;
  fieldsReady: boolean;
  audioReady: boolean;
  targetLanguages: ApiLanguage[];
  selectedTargetLang: string;
  isTranslating: boolean;
  currentLangVoices: ApiVoice[];
  activeVoiceId?: number;
  currentLang?: ApiLanguage;
  onOpenVisitorPreview: () => void;
  onOpenHistory: () => void;
  onSelectTargetLang: (code: string) => void;
  onTranslate: () => void;
  onSaveContent: () => void;
  onUploadAudio: (event: ChangeEvent<HTMLInputElement>) => void;
  onSelectVoiceId: (id: number) => void;
  onGenerateAudio: () => void;
  onDeleteCurrentContent: () => void;
  onTransition: (action: 'submit' | 'withdraw' | 'approve' | 'unpublish' | 'republish' | 'reject') => void;
  onPublish: () => void;
};

// [TÍNH NĂNG: Khung điều phối các nút tác vụ workflow bài viết]
export function ContentWorkflowActions({
  selected,
  items,
  editBody,
  isDirty,
  fieldsReady,
  audioReady,
  targetLanguages,
  selectedTargetLang,
  isTranslating,
  currentLangVoices,
  activeVoiceId,
  currentLang,
  onOpenVisitorPreview,
  onOpenHistory,
  onSelectTargetLang,
  onTranslate,
  onSaveContent,
  onUploadAudio,
  onSelectVoiceId,
  onGenerateAudio,
  onDeleteCurrentContent,
  onTransition,
  onPublish,
}: ContentWorkflowActionsProps) {
  const isPublished = selected.rawStatus === 'PUBLISHED';

  return (
    <div className="detail-actions workflow-actions">
      {/* [TÍNH NĂNG: Nhóm tác vụ phụ (Xem trước, Lịch sử, Dịch tự động)] */}
      <div className="secondary-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <button type="button" className="quiet-button" onClick={onOpenVisitorPreview}>
          Xem trước như visitor
        </button>
        <button type="button" className="quiet-button" onClick={onOpenHistory}>
          Lịch sử duyệt
        </button>
        <ContentTranslateAction
          selected={selected}
          items={items}
          editBody={editBody}
          targetLanguages={targetLanguages}
          selectedTargetLang={selectedTargetLang}
          isTranslating={isTranslating}
          onSelectTargetLang={onSelectTargetLang}
          onTranslate={onTranslate}
        />
      </div>

      {/* [TÍNH NĂNG: Nhóm tác vụ chính (Audio, Lưu nháp, Duyệt, Xuất bản)] */}
      <div className="primary-action-group">
        {!isPublished && (
          <ContentAudioAction
            isDirty={isDirty}
            fieldsReady={fieldsReady}
            needsReview={Boolean(selected.needsReview)}
            audioReady={audioReady}
            editBody={editBody}
            currentLangVoices={currentLangVoices}
            activeVoiceId={activeVoiceId}
            currentLang={currentLang}
            onUploadAudio={onUploadAudio}
            onSelectVoiceId={onSelectVoiceId}
            onGenerateAudio={onGenerateAudio}
          />
        )}

        <ContentLifecycleButtons
          selected={selected}
          isDirty={isDirty}
          fieldsReady={fieldsReady}
          audioReady={audioReady}
          onSaveContent={onSaveContent}
          onDeleteCurrentContent={onDeleteCurrentContent}
          onTransition={onTransition}
          onPublish={onPublish}
        />
      </div>
    </div>
  );
}

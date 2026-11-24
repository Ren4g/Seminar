/**
 * @file ContentAudioAction.tsx
 * @description Thành phần tải lên file MP3 và tạo giọng đọc ElevenLabs: Dropdown chọn giọng đọc (Voice) và nút tạo audio.
 * @screen Nằm trong cụm nút tác vụ chính phía dưới của Content Studio.
 * @activityDiagram Bước "Tạo hoặc cập nhật file âm thanh thuyết minh".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Nút Tải lên MP3: Thẻ `<label className="upload-button">`.
 *  - Nút Tạo audio ElevenLabs: Thẻ `<button>`.
 */

import type { ChangeEvent } from 'react';
import type { ApiLanguage, ApiVoice } from '../../api';

type ContentAudioActionProps = {
  isDirty: boolean;
  fieldsReady: boolean;
  needsReview: boolean;
  audioReady: boolean;
  editBody: string;
  currentLangVoices: ApiVoice[];
  activeVoiceId?: number;
  currentLang?: ApiLanguage;
  onUploadAudio: (event: ChangeEvent<HTMLInputElement>) => void;
  onSelectVoiceId: (id: number) => void;
  onGenerateAudio: () => void;
};

// [TÍNH NĂNG: Tải lên MP3 và tạo giọng đọc ElevenLabs]
export function ContentAudioAction({
  isDirty,
  fieldsReady,
  needsReview,
  audioReady,
  editBody,
  currentLangVoices,
  activeVoiceId,
  currentLang,
  onUploadAudio,
  onSelectVoiceId,
  onGenerateAudio,
}: ContentAudioActionProps) {
  const isPrimary = !isDirty && fieldsReady && !needsReview && !audioReady;

  return (
    <>
      {/* [TÍNH NĂNG: Nút upload file MP3 trực tiếp] */}
      <label className="upload-button">
        Tải lên MP3
        <input type="file" accept="audio/mp3,audio/mpeg,.mp3" onChange={onUploadAudio} />
      </label>

      {/* [TÍNH NĂNG: Chọn voice ElevenLabs và tạo giọng đọc tự động] */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        {currentLangVoices.length > 0 && (
          <select
            value={activeVoiceId ?? ''}
            onChange={(e) => onSelectVoiceId(Number(e.target.value))}
            style={{
              minHeight: '34px',
              padding: '0 8px',
              borderRadius: '6px',
              border: '1px solid var(--line)',
              background: 'var(--paper)',
              fontSize: '11px',
              color: 'var(--ink)',
            }}
            title="Chọn giọng đọc cho bản ghi này"
          >
            {currentLangVoices.map((v) => {
              const isDefault = currentLang?.defaultVoiceId === v.id;
              return (
                <option key={v.id} value={v.id}>
                  {v.providerVoiceKey} {isDefault ? '(Mặc định)' : ''}
                </option>
              );
            })}
          </select>
        )}
        <button
          type="button"
          className={isPrimary ? 'primary-button' : 'quiet-button'}
          disabled={isDirty || !fieldsReady}
          title={isDirty ? 'Save your edits before generating audio.' : ''}
          onClick={onGenerateAudio}
        >
          Tạo audio ElevenLabs / {editBody.length.toLocaleString('vi-VN')} ký tự
        </button>
      </div>
    </>
  );
}

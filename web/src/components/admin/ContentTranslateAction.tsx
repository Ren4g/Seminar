/**
 * @file ContentTranslateAction.tsx
 * @description Thành phần dịch tự động nội dung sang ngôn ngữ đích bằng AI: Dropdown chọn ngôn ngữ đích và nút kích hoạt dịch.
 * @screen Nằm trong cụm nút tác vụ phía dưới của Content Studio.
 * @activityDiagram Bước "Biên dịch tự động nội dung sang ngôn ngữ khác bằng AI".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Nút Dịch tự động: Thẻ `<button className="quiet-button">`.
 */

import type { ApiLanguage } from '../../api';
import type { ContentItem } from '../../types/content';
import { languageName } from '../../utils/formatters';

type ContentTranslateActionProps = {
  selected: ContentItem;
  items: ContentItem[];
  editBody: string;
  targetLanguages: ApiLanguage[];
  selectedTargetLang: string;
  isTranslating: boolean;
  onSelectTargetLang: (code: string) => void;
  onTranslate: () => void;
};

// [TÍNH NĂNG: Chọn ngôn ngữ đích và bấm dịch tự động bằng AI]
export function ContentTranslateAction({
  selected,
  items,
  editBody,
  targetLanguages,
  selectedTargetLang,
  isTranslating,
  onSelectTargetLang,
  onTranslate,
}: ContentTranslateActionProps) {
  if (targetLanguages.length === 0) return null;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <select
        aria-label="Chọn ngôn ngữ đích"
        value={selectedTargetLang}
        onChange={(e) => onSelectTargetLang(e.target.value)}
        style={{
          minHeight: '34px',
          padding: '0 8px',
          borderRadius: '6px',
          border: '1px solid var(--line)',
          background: 'var(--paper)',
          fontSize: '11px',
          color: 'var(--ink)',
        }}
        title="Chọn ngôn ngữ đích cần dịch sang"
        disabled={isTranslating}
      >
        <option value="" disabled>
          -- Chọn ngôn ngữ đích --
        </option>
        {targetLanguages.map((l) => {
          const existing = items.find(
            (it) => it.poiId === selected.poiId && it.languageCode?.toLowerCase() === l.code.toLowerCase()
          );
          const statusNote = existing ? ` (${existing.status})` : '';
          return (
            <option key={l.code} value={l.code}>
              Dịch sang: {l.name} ({l.code.toUpperCase()})
              {statusNote}
            </option>
          );  
        })}
      </select>

      <button
        type="button"
        className="quiet-button"
        disabled={!selectedTargetLang || isTranslating}
        onClick={onTranslate}
        title={
          !selectedTargetLang
            ? 'Vui lòng chọn ngôn ngữ đích'
            : `Dịch tự động nội dung này sang ${languageName(selectedTargetLang)}`
        }
      >
        {isTranslating ? 'Đang dịch…' : 'Dịch tự động'} / {editBody.length.toLocaleString('vi-VN')} characters
      </button>
    </div>
  );
}
